### MedPlus Margin Performance Dashboard: System Specification

This document outlines the complete functionality, data processing logic, and calculation methods for the MedPlus Margin Performance Dashboard application.

#### 1. Application Overview

The Margin Performance Dashboard is an analytical tool designed to help MedPlus identify and analyze margin loss across its product catalog and vendor network. It provides high-level KPIs, visual charts, and detailed drill-down capabilities to pinpoint areas of poor margin performance and optimize purchasing strategies.

**Key Features:**

*   **Interactive Dashboard:** A central homepage displaying key performance indicators (KPIs) and summary charts.
*   **Hierarchical Filtering:** Users can filter the entire application's data by:
    *   **Geography:** Pan-India, State, or City.
    *   **Time Period:** Current Month-to-Date (default) or a specific historical month.
    *   **Quantity-Based Outlier Exclusion:** Filter out unusually small purchase quantities.
*   **Drill-Down Analysis:**
    *   **Product Analysis:** A dedicated page to analyze a single product's performance, including purchase history, price trends, and margin trends.
    *   **Vendor Analysis:** A page to view all products supplied by a specific vendor and their associated margin performance.
*   **Data Visualization:** Bar and line charts to visualize top margin loss contributors and historical trends.
*   **Data Export:** Functionality to download filtered analysis data into an Excel (`.xlsx`) format.

---

#### 2. Analysis Period Logic

The application uses a rolling **four-month window** for all calculations to ensure consistency and provide sufficient data for meaningful analysis.

*   **Default Period ("Current Month till Date"):**
    *   When this option is selected, the analysis period includes the **three most recent full calendar months plus the current month up to the current date**.
    *   *Example:* If today is June 20, 2025, the analysis period is from **March 1, 2025, to June 20, 2025**.

*   **Specific Month Selection (e.g., "May 2025"):**
    *   When a user selects a specific month from the dropdown, the analysis period includes that **entire selected month plus the three full calendar months immediately preceding it**.
    *   *Example:* If a user selects "May 2025", the analysis period is from **February 1, 2025, to May 31, 2025**.

This four-month window is applied globally across all KPIs, charts, and detailed analysis pages.

---

#### 3. Core Calculation Logic

The following steps describe how the application processes data to calculate margin loss and identify outliers. This logic is primarily located in `src/lib/data.ts`.

**Step 1: Margin Calculation**

For every individual purchase transaction, the margin percentage is calculated as:
```
Margin % = ((Selling Price - Purchase Price) / Selling Price) * 100
```

**Step 2: Quantity-Based Outlier Filtering**

This filter removes transactions with unusually low quantities that could skew analysis.

1.  **Filter Selection:** The user chooses an option from the "Quantity Outlier Filter" dropdown (`None`, `1%`, `5%`).
2.  **SKU Total Quantity Calculation:** For each unique product (SKU), the system calculates the total quantity purchased within the selected four-month analysis period.
3.  **Threshold Calculation:**
    *   If `1%` is selected: Threshold = `1% * SKU Total Quantity`.
    *   If `5%` is selected: Threshold = `5% * SKU Total Quantity`.
4.  **Flagging Outliers:** Any individual purchase transaction where the `quantity` is **less than the calculated threshold** is flagged as a `isQuantityOutlier`. These transactions are excluded from all subsequent calculations.

**Step 3: Margin-Based Outlier Identification**

This logic identifies purchases with abnormally high margins, which are likely data errors and should be excluded from margin loss calculations.

1.  **Mode Margin Calculation:** For each SKU, the system determines the **mode margin** (the most frequently occurring margin percentage) across its entire purchase history. This establishes a "typical" margin for the product.
2.  **Outlier Threshold Multiplier:** A default multiplier of `4.0x` is used. This can be manually adjusted for a specific SKU on its product detail page.
3.  **Outlier Threshold Calculation:**
    ```
    Outlier Threshold = Mode Margin % * Multiplier
    ```
4.  **Flagging Outliers:** Any purchase where the `Margin %` is **greater than or equal to the Outlier Threshold** is flagged as `isMarginOutlier`.

**Step 4: Best Margin Calculation (Benchmark)**

To calculate margin loss, a "best possible" margin must be established as a benchmark.

1.  **Identify Valid Purchases:** For each SKU, the system considers all purchases within the four-month analysis period that are **not** flagged as `isMarginOutlier` or `isQuantityOutlier`.
2.  **Determine Best Margin:** The **`bestMargin`** is the highest `Margin %` found among these valid purchases.

**Step 5: Total Margin Loss Calculation**

The margin loss is calculated for every individual purchase that is **not** an outlier.

1.  **Margin Difference:**
    ```
    Margin Difference % = bestMargin % - Purchase's Margin %
    ```
2.  **Loss Per Unit:**
    ```
    Loss Per Unit = Selling Price * (Margin Difference % / 100)
    ```
3.  **Total Loss for Transaction:**
    ```
    Margin Loss = Loss Per Unit * Quantity
    ```
    If the calculated loss is negative (meaning the purchase had a better-than-best margin, which shouldn't happen with this logic but is a safeguard), it is treated as `0`.

**Step 6: Aggregating Data**

All KPIs, charts, and summary tables aggregate the `Margin Loss` and other metrics from the pool of valid, non-outlier transactions for the selected scope (geo, period, and quantity filter).