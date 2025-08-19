# **App Name**: MarginWise Telangana

## Core Features:

- KPI Dashboard: Display key performance indicators (KPIs) such as total margin loss, top products by margin loss, and top vendors by margin loss.
- Multi-Product Purchase Tracking: Track all purchases of multiple products (e.g., Dolo-650, Paracetamol-500, Azithromycin-250, Vitamin-C 1000mg, ORS Sachet) made in Telangana, with details such as vendor, date, quantity, and purchase price.
- Margin Calculation: Automatically calculate margin percentage for each purchase using the formula: ((Selling Price – Purchase Price) / Selling Price) × 100.
- Best Margin Identification: For every product, identify the purchase instance with the highest margin percentage and use it as the benchmark.
- Margin Loss Detection: Compare all other purchases of the same product against the best margin purchase and calculate the margin loss based on purchase quantity.
- Total Margin Loss Summary: Show the cumulative margin loss per product and per vendor in Telangana.
- Dashboard Overview: Display key metrics including total margin loss, top 5 products with highest margin loss, and top vendors with margin variations.
- Product Drill-Down: On clicking a product ID (e.g., Dolo-650), display all purchase history in Telangana including vendor names, purchase prices, margin %, margin loss, and a trend chart of purchase price over time.
- Vendor Drill-Down: On clicking a vendor, display all products purchased from that vendor along with their average margin vs best available margin.
- Visual Analytics: Provide bar charts for products vs margin loss, bar charts for vendors vs margin variations, and line charts for price trends of selected products.
- Alerts (Optional): Send alerts when a purchase margin falls below a defined threshold (e.g., 5%) so the purchase team can take corrective action.

## Style Guidelines:

- Primary color: Soft blue (#A0C4FF) to evoke a sense of calm and trust in financial data. It is vibrant enough to stand out in a light color scheme, but avoids cliches such as the green common in money apps.
- Background color: Light gray (#F0F4F8), a desaturated version of the primary hue for a clean and professional look.
- Accent color: Light purple (#BDB2FF) to highlight key metrics and interactive elements, offering a clear visual distinction without overwhelming the user.
- Body and headline font: 'Inter', a grotesque-style sans-serif font, for a clean, objective, modern aesthetic suitable for both headlines and body text.
- Use simple, consistent icons from a set like Phosphor or Lucide to represent different data points and actions within the dashboard. Use the accent color to emphasize them.
- Implement a clean, grid-based layout to present data in an organized and easily digestible format. Use whitespace effectively to avoid visual clutter.
- Use subtle transitions and animations (e.g., when data is updated or when navigating between product and vendor views) to enhance user experience without being distracting.