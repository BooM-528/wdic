# WDIC Agent Collaboration Rules (14 Rules)

These guidelines are designed to maintain the quality standards, architectural consistency, and Premium aesthetic of the WDIC (Why did I CALL) project.

## 🎨 UI/UX & Design (WDIC Aesthetic)

1.  **Premium Aesthetic & Glassmorphism**: All components must adhere to the "Glassmorphism" design principle (e.g., `backdrop-blur-xl`, `bg-white/60`) with thin, subtle borders (`border-white/50`). Use Rose (`#D9114A`) as the primary accent color.
2.  **Extreme Typography**: Typography should be bold and statement-making. Utilize extreme font weights (e.g., `font-[1000]`), tight `tracking-tighter`, or wide `tracking-[.25em]` for headers. Use uppercase for key UI elements.
3.  **Framer Motion Animations**: Every interaction must feel "Alive." Use `framer-motion` for entrance animations (e.g., staggered pops), hover effects, and tactile feedback to ensure a high-end feel.
4.  **Bilingual Layout Balance**: Maintain visual harmony between Thai and English fonts. Adjust sizes and weights so they complement each other without feeling cluttered, ensuring legibility even with heavy English weights.

## ⚙️ Backend & Architecture (Django/DRF)

5.  **Atomic Transactions**: Protect data integrity by using `@transaction.atomic` or `with transaction.atomic()` whenever multiple database records are modified simultaneously, especially during Parsing and AI processing.
6.  **DateTime Convention**: Use `datetime.now()` for timestamping and local time calculations, following the established pattern in `views.py` (e.g., using `%Y/%m/%d %H:%M:%S` for parsing).
7.  **Business Logic Decoupling**: Isolate complex business logic (e.g., poker hand parsing, AI services) from the views. Views should handle request/response flow only, keeping logic reusable and testable.
8.  **Constant Usage for Choices**: Never use raw strings for status or source checks. Always use model-defined `Choices` (e.g., `WdicSource.N8`) to prevent typos and ease refactoring.
9.  **Guest Identity Isolation**: All API endpoints must support individual data isolation via `X-Guest-Id`. Inherit from `GuestRequiredAPIView` to ensure proper data scoping and security.
10. **Financial & Precision Accuracy**: Always use `Decimal` fields for financial values or chip counts (e.g., `hero_invested`) to ensure maximum precision during mathematical analysis.

## 🛠️ Development & Collaboration

11. **Type-First Frontend**: Define and maintain TypeScript interfaces for all API responses in `src/lib/wdic/types.ts` to minimize runtime errors and enable full autocomplete support.
12. **AI Analysis Specification**: AI prompts and responses must support multi-language analysis (Thai by default). Correctly implement "Force re-analyze" logic to allow users to refresh AI results.
13. **Sync Documentation & Types**: Immediately update API documentation and frontend types whenever a serializer field or endpoint structure is modified.
14. **No Placeholders & Realistic Data**: Avoid placeholder text or generic images. Use realistic poker-related data and utilize the `generate_image` tool for professional assets.
