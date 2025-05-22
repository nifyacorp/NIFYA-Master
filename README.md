# NIFYA Master Repository

This repository serves as the central hub for the NIFYA project, containing various interconnected microservices that work together to provide the NIFYA platform. NIFYA aims to deliver timely notifications and insights derived from official Spanish bulletins (like BOE and DOGA) to its users.

## Architecture Overview

NIFYA employs a microservices architecture to ensure modularity, scalability, and independent development cycles for different parts of the application. The services communicate primarily through REST APIs and potentially asynchronous messaging queues (e.g., Google Cloud Pub/Sub) for background tasks.

## File Structure

This master repository utilizes Git submodules to manage the code for each individual microservice. Each subdirectory corresponds to a specific service with its own codebase, dependencies, and deployment configuration.

```
NIFYA-Master/
├── frontend/           # Submodule for the user interface
├── backend/            # Submodule for the core API
├── subscription-worker/ # Submodule for subscription management
├── boe-parser/         # Submodule for BOE parsing
├── doga-parser/        # Submodule for DOGA parsing
├── notification-worker/ # Submodule for notification processing
├── email-notification/ # Submodule for sending email notifications
└── README.md           # This file
```

## Microservices

The following table lists the core microservices within the NIFYA ecosystem:

| Service              | Description                                                      | Deployment URL                                                       | Technology Stack (Assumed) |
|----------------------|------------------------------------------------------------------|----------------------------------------------------------------------|--------------------------|
| Frontend             | User interface and client-side application                       | https://clever-kelpie-60c3a6.netlify.app                             | React/Vue/Angular?       |
| Backend              | Core API, business logic, and data orchestration                 | https://backend-415554190254.us-central1.run.app                     | Node.js/Python/Go?       |
| Subscription Worker  | Manages user subscriptions and billing cycles                    | https://subscription-worker-415554190254.us-central1.run.app         | Node.js/Python/Go?       |
| BOE Parser           | AI-powered analysis of Spanish Official Bulletin (BOE)           | https://boe-parser-415554190254.us-central1.run.app                 | Python? (AI/ML focus)    |
| DOGA Parser          | AI-powered analysis of Galician Official Bulletin (DOGA)         | https://doga-parser-415554190254.us-central1.run.app                 | Python? (AI/ML focus)    |
| Notification Worker  | Processes parsed bulletin data into user notifications           | https://notification-worker-415554190254.us-central1.run.app         | Node.js/Python/Go?       |
| Email Notification   | Sends email summaries of notifications to subscribed users       | https://email-notification-415554190254.us-central1.run.app       | Node.js/Python/Go?       |

*(Note: Technology stack is assumed and may vary)*

## Development Best Practices

### Avoiding Hardcoded Fallbacks

IMPORTANT: Never use hardcoded fallback values in your code, especially for data that should be retrieved from the database. Using hardcoded values:

- Masks real issues (like database connectivity problems)
- Prevents new data from being visible to users
- Creates inconsistencies between what's in the database and what users see
- Makes testing more difficult since real data flows aren't being exercised

Instead:
- Always fetch data from its source (database, API, etc.)
- Properly handle and display errors when data cannot be retrieved
- Use empty arrays or appropriate data structures when no data is available
- Write clear error messages that help diagnose the real problem

### Error Handling

Implement proper error handling at all layers of the application:
- Capture detailed error information for logging
- Return appropriate HTTP status codes
- Provide user-friendly error messages in the UI
- Log all errors with sufficient context for debugging

## Inter-Service Communication Flow

1.  **User Interaction:** Users interact with the `Frontend`.
2.  **Authentication:** The `Frontend` handles authentication using Firebase.
3.  **API Requests:** Authenticated requests from the `Frontend` are directed to the `Backend` API.
4.  **Backend Orchestration:** The `Backend` handles core business logic. It verifies Firebase tokens, manages user data, interacts with subscription status (potentially via `Subscription Worker`), and coordinates notification preferences.
5.  **Parsing:** The `BOE Parser` and `DOGA Parser` independently fetch and analyze official bulletins. Upon finding relevant information, they likely publish events (e.g., to a Pub/Sub topic).
6.  **Notification Processing:** The `Notification Worker` subscribes to events from the parsers. It processes this information, determines which users should be notified based on their preferences and subscription status (potentially querying the `Backend` or a shared database), and stores the notifications. It might also publish another event to trigger email sending.
7.  **Email Delivery:** The `Email Notification` service subscribes to events from the `Notification Worker` and sends formatted email summaries to users.
8.  **Subscription Management:** The `Subscription Worker` handles tasks related to subscription lifecycles (e.g., renewals, cancellations), potentially triggered by the `Backend` or scheduled jobs.

*(Note: This describes a likely communication flow. Specific implementation details like direct API calls vs. message queues might vary between services.)*

## Deployment & Configuration

-   **Frontend:** Deployed via Netlify.
-   **Backend Services:** Deployed as containerized applications on Google Cloud Run.
-   **Secrets Management:** Configuration secrets (API keys, database credentials, etc.) are managed using Google Secret Manager or injected as Runtime Environment Variables in Cloud Run. **`.env` files are not used for deployment.** Builds happen entirely within the Cloud environment to securely access these secrets.

## Development Workflow

1.  Navigate into the specific submodule directory you wish to modify (e.g., `cd backend/`).
2.  Make your code changes.
3.  Commit your changes within the submodule directory (`git add .`, `git commit -m "Your commit message"`).
4.  Push the changes for the submodule (`git push`).
5.  Navigate back to the root `NIFYA-Master` directory (`cd ..`).
6.  Add the updated submodule reference (`git add <submodule_directory>`).
7.  Commit the submodule update (`git commit -m "Update <submodule_directory>"`).
8.  Push/sync the master repository (`git push`).
9.  Pushing changes triggers the respective Cloud Build pipeline for the modified service. Monitor the build and deployment process in Google Cloud Console or Netlify.

## Testing

Automated tests, potentially using tools like Puppeteer for end-to-end testing of the `Frontend`, should be maintained within each relevant submodule. Consistent use of testing scripts helps identify regressions and bugs introduced during development.

# NIFYA Repository Compendium

This project is a compendium of interconnected repositories that work together to provide the NIFYA service. Each subservice has its own build and deployment pipeline.

## Development Workflow

1. Make changes to the relevant subservice code
2. Commit your changes to the repository
3. Push/sync your changes to trigger the build process
4. Monitor the build process in the deployment platform

## Subservices and Deployment URLs

| Service | Description | Deployment URL |
|---|----|----|
| Frontend | User interface and client-side application | https://clever-kelpie-60c3a6.netlify.app |
| Backend | Core API and business logic | https://backend-415554190254.us-central1.run.app |
| Subscription Worker | Manages subscription processing | https://subscription-worker-415554190254.us-central1.run.app |
| BOE Parser | AI-powered analysis of Spanish Official Bulletin (BOE) | https://boe-parser-415554190254.us-central1.run.app |
| DOGA Parser | AI-powered analysis of Galician Official Bulletin (DOGA) | https://doga-parser-415554190254.us-central1.run.app |
| EU Parser | AI-powered analysis of European Union Official Journal | https://eu-parser-415554190254.us-central1.run.app |
| Notification Worker | Processes notification messages and stores them in the database | https://notification-worker-415554190254.us-central1.run.app |
| Email Notification | Sends email summaries of notifications to users | https://email-notification-415554190254.us-central1.run.app |

## Frontend Architecture

### Layout Structure

The frontend application follows a strict single scrollbar design pattern with the following component hierarchy:

- **MainLayout**: The root layout component used for all pages.
  - Contains the Header and main content area
  - No scrollbars at this level

- **DashboardLayout**: Extends MainLayout by adding a sidebar.
  - Uses `layout-container` to organize the sidebar and content
  - Only the `dashboard-content` should have a scrollbar
  - The sidebar should have no scrollbar

- **Pages**: Individual page components nested inside these layouts
  - Page content should avoid adding additional scrollbars
  - Content should flow within the parent's scrollable area

### Responsive Page Design

Each main page in the application has responsive designs with distinct experiences for different screen sizes:

- **Mobile View**: Optimized for small screens
  - Compact layouts with stacked elements
  - Simplified UI with fewer visual enhancements
  - Touch-friendly button sizes and spacing
  - Full-width containers for maximum content area

- **Tablet View**: Transitional layouts
  - Adapted spacing and component sizing
  - Improved information density
  - Enhanced UI with better visual hierarchy

- **Desktop View**: Rich, enhanced experiences
  - Sophisticated layouts with grid structures
  - Visual enhancements like shadows, gradients, and animations
  - Better use of horizontal space
  - More advanced interactions and hover effects
  - Optimized information density and readability

- **Large Desktop View**: Further refinements for large screens
  - Maximum use of screen real estate
  - Optimized layout for high-resolution displays
  - Increased padding and element spacing

Each page implements this responsive approach using both:
1. CSS media queries for basic responsiveness
2. Dynamic React component adaptation based on detected screen size

### Component Screen Size Detection

Components that need distinct desktop/mobile variants use a standard approach:

```tsx
const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'large'>('mobile');

// Detect screen size for responsive styling
const updateScreenSize = useCallback(() => {
  const width = window.innerWidth;
  if (width >= 1440) {
    setScreenSize('large');
  } else if (width >= 1024) {
    setScreenSize('desktop');
  } else if (width >= 768) {
    setScreenSize('tablet');
  } else {
    setScreenSize('mobile');
  }
}, []);

// Usage in components
const isDesktop = screenSize === 'desktop' || screenSize === 'large';
// Apply different classes/styles based on screen size
```

### Header Styling

The application implements a responsive header with distinct styling for mobile and desktop experiences:

- **Mobile Header**: Simplified, compact design
  - Smaller height (56px)
  - Minimal spacing and shadows
  - Basic styling for better performance on mobile devices

- **Tablet Header**: Intermediate styling (768px+)
  - Medium height (64px)
  - Increased spacing and element sizes
  - Subtle enhancements for better visual hierarchy

- **Desktop Header**: Enhanced, sophisticated design (1024px+)
  - Taller height (72px)
  - Premium visual effects including gradients and drop shadows
  - Hover animations and interactive elements
  - Visual depth through layering and subtle effects
  - Gradient text for brand name and enhanced iconography

- **Large Desktop Header**: Further refinements (1440px+)
  - Maximum height (80px)
  - Increased spacing and padding
  - Larger interactive elements for better UX on large displays

The header styling uses a combination of screen-size specific classes that are dynamically applied based on viewport width, ensuring a tailored experience at each breakpoint.

### Example: Notifications Page

The Notifications page demonstrates the responsive design approach:

- **Mobile**: Simple list view with stacked elements
  - Compact notification cards
  - Minimal visual styling
  - Full-width layout maximizing limited screen space
  - Bottom navigation button visible only on mobile

- **Desktop**: Enhanced experience with visual depth
  - Two-column grid layout for notification items
  - Gradient page title and enhanced visual styling
  - Hover animations on interactive elements
  - Left border indicator for unread notifications
  - Sophisticated card styling with subtle shadows and borders
  - Enhanced action buttons with hover effects

### Layout CSS Structure

Key CSS classes in `layout.css`:

- `main-layout`: Root layout with `overflow: hidden`
- `layout-container`: Flex container with `overflow: hidden`
- `dashboard-content`: The only component with `overflow-y: auto`
- `sidebar-container`: Container for sidebar with `overflow: hidden`
- `sidebar`: Navigation sidebar with no scroll
- `no-sidebar-overflow`: Utility class to ensure sidebar has no scroll

### Component Structure

The main components involved in the layout system are:

- `MainLayout.tsx`: Base layout for all pages
- `DashboardLayout.tsx`: Layout with sidebar for authenticated pages
- `Sidebar.tsx`: Navigation sidebar component
- `Header.tsx`: Responsive application header with distinct mobile/desktop styling
- Page components (e.g., `Notifications.tsx`): Page-specific content

### Single Scrollbar Pattern

To maintain the single scrollbar pattern:

1. Only the `dashboard-content` div should have `overflow-y: auto`
2. All other containers should have `overflow: hidden` or no overflow property
3. Page components should avoid setting `overflow` properties
4. Content should be structured to flow within the scrollable area

### Best Practices

- Never add `overflow-y: auto` to components inside `dashboard-content`
- Use `overflow-x: hidden` only when needed for horizontal content 
- Ensure sidebar content fits within its container without scrolling
- Test layout on different screen sizes to ensure scrollbar behavior is consistent
- Maintain visual differentiation between mobile and desktop header styles
- Follow the styling patterns in header.css for consistent responsive design
- Create dedicated CSS files for major page components (e.g., notifications.css)
- Implement responsive styling that enhances the desktop experience
- Avoid reusing mobile styling for desktop without proper enhancements

## Code Standards

1. Always use the standardized UI components from the component library
2. Follow the single source of truth concept for styles, configurations, and data
3. Make minimal necessary changes to fix issues without introducing new features unless specifically requested
4. Ensure all buttons using the Button component from our UI library with appropriate props
5. Keep functionality consistent across all services
6. Maintain the single scrollbar pattern in all layouts
