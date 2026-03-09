import os
import json
import logging
from typing import Dict, Any, Optional
import google.generativeai as genai
from wdic.models import WdicHand, WdicSession

logger = logging.getLogger(__name__)


class PokerAiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-3-flash-preview"

        if self.api_key:
            genai.configure(api_key=self.api_key)

    def analyze_hand(self, hand: WdicHand, lang: str = "th") -> Dict[str, Any]:
        """
        Analyzes a poker hand using Gemini AI.
        """
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found. Returning mock analysis.")
            return self._get_mock_analysis(hand)

        try:
            hand_data = hand.actions_json or {}
            raw_text = hand.raw_text

            prompt = self._build_prompt(hand, hand_data, raw_text, lang)

            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "response_mime_type": "application/json",
                },
            )

            response = model.generate_content(prompt)
            result = json.loads(response.text)

            # Extract structured data with new technical metrics
            return {
                "content": result.get("analysis_markdown", "No analysis provided."),
                "suggestion": result.get("suggestion", "NEUTRAL"),
                "score": result.get("score", 0),
                "key_mistakes": result.get("key_mistakes", []),
                "model_name": self.model_name,
                "tokens_used": (
                    response.usage_metadata.total_token_count
                    if hasattr(response, "usage_metadata")
                    else 0
                ),
            }

        except Exception as e:
            logger.error(f"Gemini Analysis failed: {str(e)}")
            return self._get_mock_analysis(hand, error=str(e))

    def _build_prompt(
        self, hand: WdicHand, data: Dict[str, Any], raw_text: str, lang: str
    ) -> str:
        lang_instruction = (
            "Analyze and respond in THAI language."
            if lang == "th"
            else "Analyze and respond in ENGLISH language."
        )

        prompt = f"""
You are a world-class GTO (Game Theory Optimal) Poker Coach. 
Your goal is to perform a rigorous technical analysis of the following hand to find **leaks** (mistakes) in the player's ('HERO') strategy.

{lang_instruction}

HAND HISTORY:
{raw_text}

ADDITIONAL CONTEXT:
- Hero Position: {hand.hero_position}
- Hero Cards: {hand.hero_cards_str}
- Board: {hand.flop_1 or ''} {hand.flop_2 or ''} {hand.flop_3 or ''} {hand.turn or ''} {hand.river or ''}
- Hero Invested: {hand.hero_invested}
- Hero Collected: {hand.hero_collected}

INSTRUCTIONS:
1. **Be Critical**: Do not be afraid to call out bad plays. If a move was a "Blunder" (high EV loss) or "Missed Value", explain clearly why.
2. **Technical Depth**: Was the pre-flop range correct for {hand.hero_position}? Did the bet sizing reflect the board texture and SPR?
3. **Format with Markdown**:
   - Use **### Summary** for a quick overview.
   - Use **### Street-by-Street** for detailed logic.
   - Use **### The Big Mistake** to highlight the most critical error (if any).
   - Use **### Lesson for Next Time** for actionable advice.
4. **Symbols**: Use ♠, ♥, ♦, ♣ for suits (e.g., A♠ K♥, 10♦ 7♣).
5. **No Screen Names**: Always use table positions (BTN, SB, BB, UTG, CO, etc.) to refer to players.
6. **Card Formatting**: Use the format [A♠ K♥] or just A♠ K♥. Use these symbols throughout the analysis_markdown.

Return the response in the following JSON format:
{{
  "analysis_markdown": "Your technical analysis here...",
  "suggestion": "GOOD_PLAY | BLUNDER | MISSED_VALUE | TRICKY_SPOT | NEUTRAL",
  "score": (A numerical score from 0-100 based on how well Hero played, 100 being perfect GTO),
  "key_mistakes": ["Short summary of mistake 1", "Short summary of mistake 2"]
}}
"""
        return prompt

    def _get_mock_analysis(
        self, hand: WdicHand, error: Optional[str] = None
    ) -> Dict[str, Any]:
        """Returns a generic mock analysis for development or fallback."""
        error_msg = f"\n\n*Error encountered: {error}*" if error else ""
        content = f"""
### AI Analysis for Hand #{hand.hand_no} (Mock)

**Overall Impression**: 
This was a standard play from {hand.hero_position}. You followed basic opening ranges.

**Street Breakdown**:
- **Pre-flop**: Your open with {hand.hero_cards_str} is standard for your position.
- **Post-flop**: Sizing seems reasonable based on the board.

**Lesson for Next Time**:
Review your defending ranges from the blinds against aggressive late-position openers.
{error_msg}

---
*Note: This is a fallback analysis.*
"""
        return {
            "content": content.strip(),
            "suggestion": "NEUTRAL",
            "score": 0,
            "key_mistakes": [
                "Unable to perform technical analysis due to connection issue."
            ],
            "model_name": f"{self.model_name} (mock)",
            "tokens_used": 0,
        }

    def analyze_session(self, session: WdicSession, lang: str = "th") -> Dict[str, Any]:
        """
        Analyzes a poker session using Gemini AI before individual hands are analyzed.
        """
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found. Returning mock session analysis.")
            return self._get_mock_session_analysis(session)

        try:
            prompt = self._build_session_prompt(session, lang)

            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "response_mime_type": "application/json",
                },
            )

            response = model.generate_content(prompt)
            result = json.loads(response.text)

            return {
                "content": result.get("analysis_markdown", "No analysis provided."),
                "model_name": self.model_name,
                "tokens_used": (
                    response.usage_metadata.total_token_count
                    if hasattr(response, "usage_metadata")
                    else 0
                ),
            }

        except Exception as e:
            logger.error(f"Gemini Session Analysis failed: {str(e)}")
            return self._get_mock_session_analysis(session, error=str(e))

    def _build_session_prompt(self, session: WdicSession, lang: str) -> str:
        lang_instruction = (
            "Analyze and respond in THAI language."
            if lang == "th"
            else "Analyze and respond in ENGLISH language."
        )

        hands = session.hands.all()
        total_hands = hands.count()

        position_stats = {}
        hand_profits = []
        for h in hands:
            # Safely calculate profit
            collected = float(h.hero_collected) if h.hero_collected else 0.0
            invested = float(h.hero_invested) if h.hero_invested else 0.0
            profit = collected - invested
            bb = float(h.actions_json.get('blinds', {}).get('bb', 0)) if h.actions_json else 0
            hand_profits.append({"hand": h, "profit": profit, "bb": bb})
            
            pos = h.hero_position or "Unknown"
            if pos not in position_stats:
                position_stats[pos] = {"hands": 0, "profit": 0.0}
            position_stats[pos]["hands"] += 1
            position_stats[pos]["profit"] += profit

        hand_profits.sort(key=lambda x: x["profit"])
        biggest_losers = hand_profits[:3]
        biggest_winners = hand_profits[-3:]

        def format_hand_summary(h_dict):
            lh = h_dict['hand']
            bb = h_dict['bb']
            p = h_dict['profit']
            res = "Won" if p > 0 else "Lost"
            bb_str = f" ({abs(p)/bb:.1f} BB)" if bb > 0 else ""
            board = f"{lh.flop_1 or ''} {lh.flop_2 or ''} {lh.flop_3 or ''} {lh.turn or ''} {lh.river or ''}".strip()
            return f"- Hand #{lh.hand_no} ({lh.hero_position} with {lh.hero_cards_str}): {res} {abs(p)} chips{bb_str}.\n  Big Blind: {bb}\n  Board: {board}\n  Actions:\n{lh.raw_text}"

        losers_str = "\n\n".join([format_hand_summary(lh) for lh in biggest_losers if lh['profit'] < 0])
        winners_str = "\n\n".join([format_hand_summary(wh) for wh in reversed(biggest_winners) if wh['profit'] > 0])
        
        pos_str = "\n".join([f"- {pos}: {stats['hands']} hands, Net Profit: {stats['profit']} chips" for pos, stats in position_stats.items()])

        prompt = f"""
You are a world-class GTO (Game Theory Optimal) Poker Coach. 
Your goal is to perform a high-level strategic overview of a player's ('HERO') entire poker session.

{lang_instruction}

SESSION SUMMARY:
- Total Hands Played: {total_hands}
- Performance by Position:
{pos_str}

BIGGEST WINNING HANDS (Focus on what went right or if it was just luck):
{winners_str}

BIGGEST LOSING HANDS (Focus heavily on these spots. Why did they lose so many chips?):
{losers_str}

INSTRUCTIONS:
1. **Macro-Level Analysis**: Do not nitpick every detail. What is the overarching theme of this session? (e.g., "You bled chips from the blinds but played perfectly in late positions").
2. **Focus on Stack Sizes, Blinds & Sizing**: Pay close attention to Stack-to-Pot Ratios (SPR), effective stacks, and blind sizes. Were the pre-flop and post-flop bet sizings appropriate for the stack depth? Did Hero deviate from GTO sizing principles? Evaluate if the player is defending or attacking blind levels correctly.
3. **Chip Swings/Survival**: Note that losing a massive pot is critical in tournament formats. Why did the big losses happen in the highlighted hands? Do not mention 'BB Net Profit' as absolute chip swings matter more here.
4. **Format with Markdown**:
   - Use **### Session Overview** for the summary.
   - Use **### Major GTO Leaks & Sizing Errors** to address the major chip swings and sizing mistakes (focus on Stack and Blinds).
   - Use **### Actionable Advice for Next Session** for 2-3 specific adjustments focusing on stack sizes and bet sizing.
5. **Symbols**: Use ♠, ♥, ♦, ♣ for suits.

Return the response in the following JSON format:
{{
  "analysis_markdown": "Your session analysis here..."
}}
"""
        return prompt

    def _get_mock_session_analysis(self, session: WdicSession, error: Optional[str] = None) -> Dict[str, Any]:
        error_msg = f"\n\n*Error encountered: {error}*" if error else ""
        content = f"""
### Mock Session Analysis

**Session Overview**:
You played {session.hands.count()} hands in this session.

**Biggest Leaks**:
- Needs deeper review on large pots.

**Actionable Advice**:
- Review your big losses.
{error_msg}
"""
        return {
            "content": content.strip(),
            "model_name": f"{self.model_name} (mock)",
        }

