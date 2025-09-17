# Transaction History with Categorization

## Main History Screen
```
┌─────────────────────────────────────┐
│ [Back]     Transaction History      │
│                                     │
│    [All] [Sent] [Received] [Filter] │
│                                     │
│             This Week               │
│                                     │
│  ┌─ 🏌️ $25.00 Golf Caddy      Today─┐│
│  │  Pine Valley Golf Club           ││
│  │  2:34 PM                         ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─ 🏨 $15.00 Hotel Staff Yesterday─┐│
│  │  Marriott Downtown               ││
│  │  8:45 PM                         ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─ 🚗 $10.00 Valet      Yesterday─┐│
│  │  City Center Parking            ││
│  │  7:20 PM                         ││
│  └─────────────────────────────────┘│
│                                     │
│            Last Week                │
│                                     │
│  ┌─ 🍽️ $18.00 Restaurant   Sep 10─┐│
│  │  Mario's Italian Bistro         ││
│  │  7:15 PM                         ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Transaction Detail View
```
┌─────────────────────────────────────┐
│ [Back]    Transaction Details       │
│                                     │
│          ┌─────────────────┐        │
│          │       ✅        │        │
│          │    Completed    │        │
│          │     $25.00      │        │
│          └─────────────────┘        │
│                                     │
│             🏌️ Golf Caddy           │
│           Mike Johnson              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Date: Today, Sep 16             ││
│  │ Time: 2:34 PM                   ││
│  │ Location: Pine Valley Golf      ││
│  │ Payment: Chase •••• 1234        ││
│  │ Fee: $0.00 (Free)               ││
│  │ Transaction ID: TT-2024-789123  ││
│  └─────────────────────────────────┘│
│                                     │
│            [Share Receipt]          │
│                                     │
│          [Report Problem]           │
│                                     │
│            [Tip Again]              │
└─────────────────────────────────────┘
```

## Filter & Category View
```
┌─────────────────────────────────────┐
│ [Back]        Filter By             │
│                                     │
│            Category                 │
│                                     │
│  ┌─ ✓ All Categories              ─┐│
│  ┌─ ○ 🏌️ Golf (12)               ─┐│
│  ┌─ ○ 🏨 Hotel (8)                ─┐│
│  ┌─ ○ 🚗 Valet (15)               ─┐│
│  ┌─ ○ 🍽️ Restaurant (23)          ─┐│
│  ┌─ ○ 🎭 Entertainment (5)        ─┐│
│  ┌─ ○ 🛍️ Retail (3)               ─┐│
│  ┌─ ○ 🚕 Transportation (7)       ─┐│
│                                     │
│           Time Period               │
│                                     │
│  ┌─ ✓ All Time                    ─┐│
│  ┌─ ○ This Week                   ─┐│
│  ┌─ ○ This Month                  ─┐│
│  ┌─ ○ Last 3 Months               ─┐│
│  ┌─ ○ Custom Range                ─┐│
│                                     │
│            [Apply Filter]           │
└─────────────────────────────────────┘
```

## Monthly Summary View
```
┌─────────────────────────────────────┐
│ [Back]    September 2024    [Export]│
│                                     │
│          Monthly Summary            │
│                                     │
│         ┌─────────────────┐         │
│         │    $248.00      │         │
│         │  Total Tipped   │         │
│         └─────────────────┘         │
│                                     │
│  🏌️ Golf      $125.00  (50.4%)     │
│  ████████████████████████████       │
│                                     │
│  🍽️ Restaurant $68.00  (27.4%)     │
│  █████████████████                  │
│                                     │
│  🚗 Valet      $35.00  (14.1%)      │
│  ████████                           │
│                                     │
│  🏨 Hotel      $20.00  (8.1%)       │
│  ████                               │
│                                     │
│           73 Tips Given             │
│         Average: $3.40              │
│                                     │
│         [View Details]              │
│                                     │
│        [Export Statement]           │
└─────────────────────────────────────┘
```

## Search Interface
```
┌─────────────────────────────────────┐
│ [Back]        Search                │
│                                     │
│  ┌─ 🔍 Search transactions...    ─┐ │
│  └─────────────────────────────────┘│
│                                     │
│           Recent Searches           │
│                                     │
│  • "Golf caddy"                     │
│  • "Marriott"                       │
│  • "September"                      │
│                                     │
│         Quick Filters               │
│                                     │
│  [Large Tips] [This Week] [Golf]    │
│                                     │
│  [Restaurant] [Hotel] [Yesterday]   │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

## Received Tips View
```
┌─────────────────────────────────────┐
│ [Back]      Tips Received           │
│                                     │
│    [All] [Sent] [Received] [Filter] │
│                                     │
│           Today - $85.00            │
│                                     │
│  ┌─ 💰 $25.00 from Sarah     3:15PM─┐│
│  │  🏌️ Golf Caddy Tip              ││
│  │  Transaction Complete            ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─ 💰 $35.00 from Mike      2:30PM─┐│
│  │  🍽️ Restaurant Service          ││
│  │  Transaction Complete            ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─ 💰 $25.00 from Lisa      1:45PM─┐│
│  │  🏨 Hotel Housekeeping           ││
│  │  Transaction Complete            ││
│  └─────────────────────────────────┘│
│                                     │
│            Yesterday                │
│                                     │
│  ┌─ 💰 $15.00 from John      8:20PM─┐│
│  │  🚗 Valet Service                ││
│  │  Transaction Complete            ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Design Specifications

### Transaction Card Design
```css
.transaction-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin: 8px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.transaction-card:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Category-specific colors */
.transaction-card.golf {
  border-left-color: #4CAF50;
}

.transaction-card.restaurant {
  border-left-color: #FF9800;
}

.transaction-card.hotel {
  border-left-color: #9C27B0;
}

.transaction-card.valet {
  border-left-color: #F44336;
}
```

### Category Icons & Colors
```css
.category-icon {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.category-golf {
  background: #E8F5E8;
  color: #2E7D32;
}

.category-restaurant {
  background: #FFF3E0;
  color: #F57C00;
}

.category-hotel {
  background: #F3E5F5;
  color: #7B1FA2;
}

.category-valet {
  background: #FFEBEE;
  color: #C62828;
}
```

### Amount Display
```css
.transaction-amount {
  font-size: 18px;
  font-weight: 700;
  color: #2E7D32;
}

.transaction-amount.received {
  color: #2E7D32;
}

.transaction-amount.sent {
  color: #1976D2;
}

.transaction-amount.pending {
  color: #F57C00;
}

.transaction-amount.failed {
  color: #D32F2F;
}
```

## Category System

### Automatic Categorization
```javascript
const categorizeTransaction = (location, merchantName, time) => {
  const categories = {
    golf: ['golf', 'course', 'caddy', 'pro shop', 'clubhouse'],
    restaurant: ['restaurant', 'cafe', 'bar', 'bistro', 'grill', 'diner'],
    hotel: ['hotel', 'resort', 'inn', 'lodge', 'suites', 'motel'],
    valet: ['valet', 'parking', 'garage', 'lot'],
    entertainment: ['theater', 'cinema', 'club', 'venue', 'arena'],
    retail: ['store', 'shop', 'mall', 'boutique', 'market'],
    transportation: ['taxi', 'uber', 'lyft', 'airport', 'station']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (location.toLowerCase().includes(keyword) ||
          merchantName.toLowerCase().includes(keyword)) {
        return category;
      }
    }
  }

  return 'other';
};
```

### Manual Category Assignment
```javascript
const updateTransactionCategory = (transactionId, newCategory) => {
  // Allow users to manually recategorize transactions
  // Update machine learning model with user preference
  return api.updateTransaction(transactionId, { category: newCategory });
};
```

## Filter System

### Advanced Filtering
```css
.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  background: #F5F5F5;
  border-radius: 20px;
  font-size: 14px;
  margin: 4px;
  cursor: pointer;
}

.filter-chip.active {
  background: #E3F2FD;
  color: #1976D2;
}

.filter-chip .remove {
  margin-left: 8px;
  width: 16px;
  height: 16px;
  background: #999;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}
```

### Date Range Picker
```javascript
const DateRangePicker = {
  presets: [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Last 3 Months', value: 'last3Months' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Custom Range', value: 'custom' }
  ]
};
```

## Search Functionality

### Search Implementation
```javascript
const searchTransactions = (query, filters = {}) => {
  const searchTerms = query.toLowerCase().split(' ');

  return transactions.filter(transaction => {
    // Text search
    const searchText = [
      transaction.merchant,
      transaction.location,
      transaction.category,
      transaction.notes
    ].join(' ').toLowerCase();

    const matchesSearch = searchTerms.every(term =>
      searchText.includes(term)
    );

    // Apply filters
    const matchesCategory = !filters.category ||
      transaction.category === filters.category;

    const matchesDateRange = !filters.dateRange ||
      isWithinDateRange(transaction.date, filters.dateRange);

    const matchesAmount = !filters.amountRange ||
      isWithinAmountRange(transaction.amount, filters.amountRange);

    return matchesSearch && matchesCategory &&
           matchesDateRange && matchesAmount;
  });
};
```

## Export & Sharing

### Export Options
```javascript
const exportOptions = {
  pdf: {
    label: 'PDF Statement',
    format: 'application/pdf',
    generator: generatePDFStatement
  },
  csv: {
    label: 'CSV Data',
    format: 'text/csv',
    generator: generateCSVExport
  },
  json: {
    label: 'JSON Data',
    format: 'application/json',
    generator: generateJSONExport
  }
};

const generatePDFStatement = (transactions, period) => {
  // Generate professional PDF with charts and summaries
  return createPDF({
    transactions,
    period,
    charts: generateCharts(transactions),
    summary: calculateSummary(transactions)
  });
};
```

## Accessibility Features

### Screen Reader Support
```html
<div role="region" aria-label="Transaction history">
  <div
    role="button"
    tabindex="0"
    aria-label="Golf caddy tip of 25 dollars to Mike Johnson on September 16th at 2:34 PM">
    <!-- Transaction card content -->
  </div>
</div>
```

### Keyboard Navigation
- Arrow keys: Navigate between transactions
- Enter/Space: View transaction details
- Tab: Move between filter options
- Escape: Close detail views or filters

### Voice Commands
```javascript
const voiceCommands = {
  "show golf tips": () => filterBy({ category: 'golf' }),
  "this week": () => filterBy({ period: 'thisWeek' }),
  "export statement": () => openExportMenu(),
  "search for marriott": (query) => searchTransactions(query)
};
```

## Performance Optimizations

### Virtual Scrolling
```javascript
const VirtualTransactionList = {
  itemHeight: 80,
  bufferSize: 5,
  visibleItems: Math.ceil(window.innerHeight / 80) + 10,

  getVisibleRange() {
    const scrollTop = this.scrollContainer.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleItems,
      this.transactions.length
    );

    return { startIndex, endIndex };
  }
};
```

### Caching Strategy
```javascript
const TransactionCache = {
  cache: new Map(),
  maxAge: 5 * 60 * 1000, // 5 minutes

  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.maxAge) {
      return item.data;
    }
    return null;
  },

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
};
```

## Analytics & Insights

### Spending Insights
```javascript
const generateInsights = (transactions) => {
  return {
    topCategories: getTopCategories(transactions),
    averageTip: calculateAverageTip(transactions),
    monthOverMonth: calculateMonthOverMonth(transactions),
    peakTimes: findPeakTippingTimes(transactions),
    locations: getTopLocations(transactions),
    trends: calculateTrends(transactions)
  };
};
```

### Data Visualization
```css
.chart-container {
  height: 200px;
  margin: 16px 0;
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.progress-bar {
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}
```