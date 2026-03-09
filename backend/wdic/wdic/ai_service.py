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

            # Extract structured data
            return {
                "content": result.get("analysis_markdown", "No analysis provided."),
                "suggestion": result.get("suggestion", "NEUTRAL"),
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
            "Respond in THAI language."
            if lang == "th"
            else "Respond in ENGLISH language."
        )

        prompt = f"""
You are a professional high-stakes poker coach. Analyze the following hand history for the player 'HERO'.

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
1. Provide a detailed strategic analysis in Markdown format.
2. IMPORTANT: when mentioning cards or suits, use the following symbols for readability:
   - s -> ♠ (Spades)
   - h -> ♥ (Hearts)
   - d -> ♦ (Diamonds)
   - c -> ♣ (Clubs)
   Example: [As Qd] should be written as A♠ Q♦. Use these symbols throughout the analysis_markdown.
3. IMPORTANT: Use table positions (e.g. BTN, SB, BB, UTG, CO, etc.) to refer to players rather than using their screen names or IDs.
4. Evaluate if the play was overall good, a blunder, or missed value.
5. Return the response in the following JSON format:
{{
  "analysis_markdown": "Your detailed analysis here...",
  "suggestion": "ONE_OF: GOOD_PLAY, BLUNDER, MISSED_VALUE, TRICKY_SPOT, NEUTRAL"
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
This was a standard play from {hand.hero_position}. You followed basic GTO principles for opening ranges.

**Street Breakdown**:
- **Pre-flop**: Your open with {hand.hero_cards_str} is within the top 15% of hands, appropriate for your position.
- **Post-flop**: Without more specific data on opponent tendencies, your sizing seems balanced.

**Strategic Tip**: 
Pay attention to the SPR (Stack-to-Pot Ratio) on the turn to avoid committing yourself with marginal hands.
{error_msg}

---
*Note: This is a fallback analysis.*
"""
        return {
            "content": content.strip(),
            "suggestion": "NEUTRAL",
            "model_name": f"{self.model_name} (mock)",
            "tokens_used": 0,
        }
