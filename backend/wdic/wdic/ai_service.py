import os
import json
import logging
from typing import Dict, Any, Optional
import google.generativeai as genai
from wdic.models import WdicHand

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
