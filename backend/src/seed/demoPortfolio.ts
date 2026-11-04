// Seed data for the demo project "Awesome Demo Portfolio": a fully planned portfolio website.
// Plain data only (no database calls), so a test can check it against the web template.
// Every item has a `ref`, a short name used here to point at the item (for relationships,
// groups, tasks and so on). The runner (seedDemo.ts) turns refs into real ids.

export type Status = "planned" | "in_progress" | "done";

export type SeedItem = {
  ref: string;
  type: string; // a key from the web template
  title: string;
  description?: string;
  status: Status;
  isMvp?: boolean;
  details?: { title: string; url?: string; text?: string }[];
};

export const demoProject = {
  name: "Awesome Demo Portfolio",
  template: "web",
  description:
    "A personal portfolio website that shows my projects, skills and contact details. " +
    "Fully planned in PLANter, used as demo data: it uses every item type, every relationship type, " +
    "all three statuses, groups, tasks, sprints, item details and inspiration.",
};

export const demoItems: SeedItem[] = [
  // PAGES
  { ref: "pageHome", type: "page", title: "Home", description: "Landing page: who I am and my best work.", status: "done", isMvp: true },
  { ref: "pageProjects", type: "page", title: "Projects", description: "Filterable grid of all projects.", status: "in_progress", isMvp: true },
  { ref: "pageProjectDetail", type: "page", title: "Project detail", description: "One project: story, screenshots, links.", status: "planned", isMvp: true },
  { ref: "pageAbout", type: "page", title: "About", description: "Background, skills and a downloadable resume.", status: "in_progress" },
  { ref: "pageContact", type: "page", title: "Contact", description: "Contact form and social links.", status: "planned", isMvp: true },
  { ref: "pageAdmin", type: "page", title: "Admin dashboard", description: "Only for me: add, edit and delete projects.", status: "planned" },
  // Intentional gap: a page with no components or connections, to test warnings later
  { ref: "pageNotFound", type: "page", title: "Not found (404)", description: "Shown for unknown URLs.", status: "planned" },

  // COMPONENTS
  { ref: "compNavbar", type: "component", title: "Navbar", description: "Logo, page links and the theme toggle.", status: "done", isMvp: true },
  { ref: "compFooter", type: "component", title: "Footer", description: "Social links and copyright.", status: "done" },
  { ref: "compHero", type: "component", title: "Hero", description: "Big intro with name, title and call to action.", status: "done", isMvp: true },
  { ref: "compButton", type: "component", title: "Button", description: "Shared button used all over the site.", status: "done" },
  { ref: "compProjectCard", type: "component", title: "Project card", description: "Thumbnail, title and tags for one project.", status: "in_progress", isMvp: true },
  { ref: "compProjectGrid", type: "component", title: "Project grid", description: "Responsive grid of project cards with filter chips.", status: "in_progress", isMvp: true },
  { ref: "compImageGallery", type: "component", title: "Image gallery", description: "Screenshots with a lightbox.", status: "planned" },
  { ref: "compSkillsList", type: "component", title: "Skills list", description: "Skills grouped by area with a level indicator.", status: "planned" },
  { ref: "compContactForm", type: "component", title: "Contact form", description: "Name, email and message with inline errors.", status: "planned", isMvp: true },
  { ref: "compThemeToggle", type: "component", title: "Theme toggle", description: "Switch between light and dark mode.", status: "planned" },
  { ref: "compProjectForm", type: "component", title: "Project form", description: "Create or edit a project in the admin area.", status: "planned" },

  // FUNCTIONS
  { ref: "fnFetchProjects", type: "function", title: "Fetch projects", description: "Loads all projects from the API.", status: "in_progress", isMvp: true },
  { ref: "fnFilterProjects", type: "function", title: "Filter projects", description: "Filters the list by tag.", status: "planned" },
  { ref: "fnSubmitContact", type: "function", title: "Submit contact form", description: "Validates the form and saves the message.", status: "planned", isMvp: true },
  { ref: "fnSendEmail", type: "function", title: "Send email notification", description: "Emails me when a new message arrives.", status: "planned" },
  { ref: "fnToggleTheme", type: "function", title: "Toggle theme", description: "Saves the choice in localStorage.", status: "planned" },
  { ref: "fnSaveProject", type: "function", title: "Save project", description: "Creates or updates a project (admin).", status: "planned" },
  // Intentional gap: nothing triggers this function
  { ref: "fnDeleteProject", type: "function", title: "Delete project", description: "Removes a project (admin).", status: "planned" },

  // DATA
  { ref: "dataProjects", type: "data", title: "Projects table", description: "title, summary, tags, repo_url, live_url, thumbnail_url", status: "in_progress", isMvp: true },
  { ref: "dataMessages", type: "data", title: "Messages table", description: "name, email, message, created_at", status: "planned", isMvp: true },
  { ref: "dataSkills", type: "data", title: "Skills table", description: "name, area, level", status: "planned" },

  // AUTHENTICATION
  { ref: "authAdmin", type: "authentication", title: "Admin login", description: "Email and password for me only, no public sign-up.", status: "planned" },

  // DESIGN
  { ref: "designPalette", type: "design", title: "Colour palette", description: "Light and dark palettes with accessible contrast.", status: "done", isMvp: true },
  { ref: "designTypography", type: "design", title: "Typography", description: "One heading font, one body font, a type scale.", status: "done" },
  { ref: "designLayout", type: "design", title: "Layout and spacing", description: "12 column grid, spacing scale and breakpoints.", status: "in_progress" },

  // ASSETS
  { ref: "assetLogo", type: "asset", title: "Logo", description: "SVG logo in two colours.", status: "done" },
  { ref: "assetPhoto", type: "asset", title: "Profile photo", description: "Square photo, optimised for the web.", status: "planned" },
  { ref: "assetScreenshots", type: "asset", title: "Project screenshots", description: "Two to four per project, WebP.", status: "planned" },
  { ref: "assetResume", type: "asset", title: "Resume (PDF)", description: "Downloadable from the About page.", status: "planned" },

  // TESTING
  { ref: "testContact", type: "testing", title: "Contact form validation test", description: "Rejects empty and invalid input.", status: "planned" },
  { ref: "testFilter", type: "testing", title: "Project filter test", description: "Filtering by tag returns the right projects.", status: "planned" },
  { ref: "testAuth", type: "testing", title: "Admin access test", description: "Admin routes reject visitors who are not logged in.", status: "planned" },
  { ref: "testNavbar", type: "testing", title: "Navbar test", description: "Every link goes to the right page.", status: "done" },

  // TECH STACK
  {
    ref: "techReact", type: "tech_stack", title: "React", status: "done", isMvp: true,
    description: "UI library for the whole site.",
    details: [
      { title: "Official docs", url: "https://react.dev" },
      { title: "Why", text: "I know it well and it fits component based pages." },
    ],
  },
  {
    ref: "techTypescript", type: "tech_stack", title: "TypeScript", status: "done",
    description: "Types for the frontend and the API.",
    details: [{ title: "Handbook", url: "https://www.typescriptlang.org/docs/" }],
  },
  {
    ref: "techVite", type: "tech_stack", title: "Vite", status: "done",
    description: "Dev server and build tool.",
    details: [{ title: "Guide", url: "https://vite.dev/guide/" }],
  },
  {
    ref: "techPostgres", type: "tech_stack", title: "PostgreSQL", status: "in_progress",
    description: "Database for projects, skills and messages.",
    details: [{ title: "Note", text: "Hosted on Supabase, accessed through Prisma." }],
  },
  {
    ref: "techVercel", type: "tech_stack", title: "Vercel", status: "planned",
    description: "Hosting for the frontend.",
    details: [{ title: "Docs", url: "https://vercel.com/docs" }],
  },
];

// Read each one as "<source> <type> <target>". All combinations come from the web template.
export const demoRelationships: { source: string; type: string; target: string }[] = [
  // belongs_to: structure
  { source: "compNavbar", type: "belongs_to", target: "pageHome" },
  { source: "compHero", type: "belongs_to", target: "pageHome" },
  { source: "compFooter", type: "belongs_to", target: "pageHome" },
  { source: "compProjectGrid", type: "belongs_to", target: "pageProjects" },
  { source: "compProjectGrid", type: "belongs_to", target: "pageHome" },
  { source: "compImageGallery", type: "belongs_to", target: "pageProjectDetail" },
  { source: "compSkillsList", type: "belongs_to", target: "pageAbout" },
  { source: "compContactForm", type: "belongs_to", target: "pageContact" },
  { source: "compProjectForm", type: "belongs_to", target: "pageAdmin" },
  { source: "compThemeToggle", type: "belongs_to", target: "compNavbar" },
  { source: "compProjectCard", type: "belongs_to", target: "compProjectGrid" },
  { source: "compButton", type: "belongs_to", target: "compHero" },
  { source: "compButton", type: "belongs_to", target: "compContactForm" },

  // navigates_to
  { source: "pageHome", type: "navigates_to", target: "pageProjects" },
  { source: "pageHome", type: "navigates_to", target: "pageContact" },
  { source: "pageProjects", type: "navigates_to", target: "pageProjectDetail" },
  { source: "pageProjectDetail", type: "navigates_to", target: "pageProjects" }, // a loop, allowed
  { source: "compNavbar", type: "navigates_to", target: "pageAbout" },
  { source: "compHero", type: "navigates_to", target: "pageProjects" },
  { source: "compProjectCard", type: "navigates_to", target: "pageProjectDetail" },

  // triggers
  { source: "pageProjects", type: "triggers", target: "fnFetchProjects" },
  { source: "pageHome", type: "triggers", target: "fnFetchProjects" },
  { source: "compProjectGrid", type: "triggers", target: "fnFilterProjects" },
  { source: "compContactForm", type: "triggers", target: "fnSubmitContact" },
  { source: "fnSubmitContact", type: "triggers", target: "fnSendEmail" },
  { source: "compThemeToggle", type: "triggers", target: "fnToggleTheme" },
  { source: "compProjectForm", type: "triggers", target: "fnSaveProject" },

  // reads_from / writes_to
  { source: "fnFetchProjects", type: "reads_from", target: "dataProjects" },
  { source: "fnFilterProjects", type: "reads_from", target: "dataProjects" },
  { source: "fnSendEmail", type: "reads_from", target: "dataMessages" },
  { source: "fnSubmitContact", type: "writes_to", target: "dataMessages" },
  { source: "fnSaveProject", type: "writes_to", target: "dataProjects" },
  { source: "fnDeleteProject", type: "writes_to", target: "dataProjects" },

  // uses: design and assets
  { source: "pageHome", type: "uses", target: "designLayout" },
  { source: "compNavbar", type: "uses", target: "designPalette" },
  { source: "compButton", type: "uses", target: "designPalette" },
  { source: "compHero", type: "uses", target: "designTypography" },
  { source: "compNavbar", type: "uses", target: "assetLogo" },
  { source: "pageAbout", type: "uses", target: "assetPhoto" },
  { source: "pageAbout", type: "uses", target: "assetResume" },
  { source: "compImageGallery", type: "uses", target: "assetScreenshots" },
  { source: "compProjectCard", type: "uses", target: "assetScreenshots" },

  // protects
  { source: "authAdmin", type: "protects", target: "pageAdmin" },
  { source: "authAdmin", type: "protects", target: "fnSaveProject" },
  { source: "authAdmin", type: "protects", target: "fnDeleteProject" },

  // tests
  { source: "testContact", type: "tests", target: "compContactForm" },
  { source: "testContact", type: "tests", target: "fnSubmitContact" },
  { source: "testFilter", type: "tests", target: "fnFilterProjects" },
  { source: "testAuth", type: "tests", target: "authAdmin" },
  { source: "testAuth", type: "tests", target: "pageAdmin" },
  { source: "testNavbar", type: "tests", target: "compNavbar" },
];

export const demoGroups: { name: string; description?: string; items: string[] }[] = [
  {
    name: "Navigation",
    description: "Everything the visitor uses to move around.",
    items: ["compNavbar", "compFooter", "compThemeToggle", "pageNotFound"],
  },
  {
    name: "Contact flow",
    description: "From the form to my inbox.",
    items: ["pageContact", "compContactForm", "fnSubmitContact", "fnSendEmail", "dataMessages", "testContact"],
  },
  {
    name: "Admin area",
    description: "Only visible to me.",
    items: ["pageAdmin", "compProjectForm", "fnSaveProject", "fnDeleteProject", "authAdmin", "testAuth"],
  },
  {
    name: "Branding",
    items: ["designPalette", "designTypography", "assetLogo", "assetPhoto"],
  },
  {
    name: "Project showcase",
    description: "Showing my work.",
    // Items can be in several groups: compNavbar is in Navigation and here
    items: ["pageProjects", "pageProjectDetail", "compProjectGrid", "compProjectCard", "compImageGallery", "dataProjects", "compNavbar"],
  },
];

export const demoSprints: { name: string; tasks: { title: string; item?: string; done: boolean }[] }[] = [
  {
    name: "Sprint 1: Foundation and design",
    tasks: [
      { title: "Set up Vite, React and TypeScript", item: "techReact", done: true },
      { title: "Pick colours and test contrast", item: "designPalette", done: true },
      { title: "Choose fonts and a type scale", item: "designTypography", done: true },
      { title: "Draw the logo", item: "assetLogo", done: true },
      { title: "Build Navbar and Footer", item: "compNavbar", done: true },
    ],
  },
  {
    name: "Sprint 2: Showing the work",
    tasks: [
      { title: "Build the Hero section", item: "compHero", done: true },
      { title: "Create the projects table", item: "dataProjects", done: true },
      { title: "Fetch and show projects", item: "fnFetchProjects", done: false },
      { title: "Build Project card and Project grid", item: "compProjectGrid", done: false },
      { title: "Take project screenshots", item: "assetScreenshots", done: false },
      { title: "Add tag filter", item: "fnFilterProjects", done: false },
    ],
  },
  {
    name: "Sprint 3: Contact and admin",
    tasks: [
      { title: "Build the contact form with validation", item: "compContactForm", done: false },
      { title: "Save messages and send the email", item: "fnSubmitContact", done: false },
      { title: "Write the contact form test", item: "testContact", done: false },
      { title: "Add admin login", item: "authAdmin", done: false },
      { title: "Build admin dashboard and project form", item: "pageAdmin", done: false },
    ],
  },
];

// Tasks that are not in any sprint yet (the backlog); some linked to an item, some not
export const demoBacklogTasks: { title: string; item?: string; done: boolean }[] = [
  { title: "Deploy the frontend to Vercel", item: "techVercel", done: false },
  { title: "Add the dark mode toggle", item: "compThemeToggle", done: false },
  { title: "Write a good About text", item: "pageAbout", done: false },
  { title: "Buy a domain name", done: false },
  { title: "Run a Lighthouse check", done: false },
];

export const demoInspirations: { title: string; url?: string; text?: string }[] = [
  { title: "Brittany Chiang", url: "https://brittanychiang.com", text: "Clean layout and a strong project list." },
  { title: "Bruno Simon", url: "https://bruno-simon.com", text: "Playful 3D idea. Too big for my scope, but fun." },
  { title: "Keep it simple", text: "Recruiters spend seconds on a portfolio: projects first, contact one click away." },
];
