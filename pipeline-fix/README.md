# Pipeline Page Horizontal Scroll Fix

This fix enables horizontal scrolling on the Pipeline page for iPad and Mobile devices without affecting other pages.

## Files to Update

1. `frontend/src/index.css` - Add CSS at the end of file
2. `frontend/src/pages/Pipeline.jsx` - Two small edits

## Instructions

### Step 1: Update index.css

Add the contents of `index.css.patch` at the **END** of your existing `frontend/src/index.css` file.

### Step 2: Update Pipeline.jsx

Make these two changes in `frontend/src/pages/Pipeline.jsx`:

**Change 1:** Find the main return statement (around line 575-576):
```jsx
// FIND THIS:
return (
  <div className="space-y-6" data-testid="pipeline-page">

// REPLACE WITH:
return (
  <div className="space-y-6" data-testid="pipeline-page" data-page="pipeline">
```

**Change 2:** Find the kanban board container (around line 606-607):
```jsx
// FIND THIS:
<div className="overflow-x-auto pb-4">

// REPLACE WITH:
<div className="pipeline-board overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
```

## Why This Works

- `data-page="pipeline"` is a unique attribute only on the Pipeline page
- `.pipeline-board` class is only used in Pipeline.jsx
- CSS selectors use these to override `overflow-x: hidden` ONLY for Pipeline
- Other pages (Leads, Customers, Tasks, etc.) remain unaffected
