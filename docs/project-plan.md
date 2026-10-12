## Project plan

### Initial idea

- Project Overview

    - Short description of the project (elevator pitch)?

      My examensarbete will be a visual planning tool for code projects. It helps you go from having issues visuializing your idea and understanding the whole picture, to knowing exactly what you are going to build, before writing any code. Imagine a full blueprint of the project that helps you keep track of your planning and development.

      in my project planner a project is broken down into items such as pages, components, functions, data, design, assets, authentication, testing, tech stack and MVP. Items are connected through typed relationships: a button belongs to a page, triggers a function, which reads from a database table. The connections can be shown as an interactive map of the whole project through React Flow, which makes it easier to see how everything fits together, spot things that have been overlooked and see what is affected when something changes. It helps you plan the things you normally don't think about or forget until the end.

      The tool also has a progress overview showing what is planned and completed and a todo list where tasks are organised into sprints.

      For the examensarbete I will focus on a web development template. The structure is generic (item types and relationship types come from a template), so other project types can be supported later. If possible there will be a game project template where quests, characters and locations are just different item types connected the same way.

    - What is the name of the project?
      - PLANter (work in progress)

- Tech Stack & Architecture

    - What technologies do you plan to use? (frontend, backend, DB, hosting, third-party services, APIs etc)

      My tech stack is based on my LIA who use react, typescript and postgresql. I will use React flow, zod, prisma and an Ai api as new technology. I will also dive further into CRUD, Supabase and typescript than i have before.

    - Repository

        - One GitHub repo with two parts: frontend/ and backend/

    - Frontend

        - React + TypeScript (Vite)
        - React Flow for the visual relationship map (nodes, edges, dragging, zoom) (new technology)

    - Backend

        - Node.js + Express + TypeScript
        - Zod for validating requests and defining the shape of items, relationships and tasks (new technology)
        - Prisma as ORM for typed database access: schema, migrations and queries. Works together with Zod: Zod validates the input and relationship rules, Prisma saves and fetches the data with matching types (new technology)
        - Handles validation, relationship rules, progress calculation, warnings and (optionally) the AI API call (new technology)
        - Small REST API: /api/projects, /api/items, /api/relationships, /api/tasks, /api/sprints, later /api/ai/analyze

    - Database & services

        - Supabase
            - PostgreSQL database (relational data: projects, items, relationships, tasks, sprints), accessed from the backend through Prisma. Data integrity is also enforced in the database (constraints, foreign keys, enums)
            - Row Level Security enabled on all tables, with policies so that users can only access their own data
            - Storage (for inspiration images)
            - Authentication

    - Hosting

        - Vercel for the frontend
        - Heroku for the backend (limited free usage, is checked early; Render or Railway as backup)

    - Third-party services and APIs

        - Supabase
        - AI API (could, backend)

    - Other tools

        - Figma
        - Vitest (with Supertest for API tests) for automated tests

- Moscow

    - Must

        Account and projects
        - Register, log in and log out (Supabase Auth)
        - Create, edit, delete and list own projects
        - Data stored per user and protected from other users (Row Level Security in Supabase, ownership also checked in the backend)

        Template and items
        - Generic data model where item and relationship types come from a template (makes a game template possible later without a rewrite)
        - One web development template with categories: pages, components, functions, data, design, assets, authentication, testing, tech stack, MVP, Project Description
        - Create, edit, delete and view items in each category (CRUD)
        - Item status: planned / in progress / done

        Relationships and map
        - Create and delete typed relationships (for example "belongs to", "triggers", "uses", "depends on")
        - Rules for which relationship types are allowed between which item types (defined as Zod schemas)
        - "File" view of all components in project
        - Visual relationship map in React Flow

        Progress and tasks
        - Progress overview (planned vs completed, per category and total)

        Delivery
        - Backend API with input validation and error handling
        - Deployed working version (Vercel + Heroku)
        - README
        - Secrets in environment variables

    - Should

        Progress and tasks
        - Create items and connections from the map and save node positions
        - Todo list with create, edit, complete and delete

        Understanding the plan
        - Impact view: select an item and highlight everything connected to it
        - Warnings for overlooked things (a page with no components, a function nothing triggers, an MVP item with no tasks)
        - Filter the map by category, status or item type
        - Search items

        Planning
        - Mark items as part of the MVP
        - Link inspiration links and images for each item/component
        - Link tasks to items
        - Sprints: create a sprint and assign tasks to it

        Quality
        - Automated tests for core logic (relationship rules, progress, warnings)
        - Responsive layout (laptop and tablet)
        - Loading and error states and confirmation before deleting

    - Could

        Game template
        - Second template for game projects: story chapters, characters, quests, locations, gameplay systems, items
        - Game relationship types (for example "takes place in", "rewards", "requires", "unlocks")
        - Choose the template when creating a project
        - Quest and story flow shown on the same map

        AI
        - AI analysis: Looks for faults or missing parts in the planned project
        - Create sprints: take the planned projects components/todo tasks and create sprints

        Extra planning features
        - MoSCoW priority tag on items
        - Drag-and-drop sprint board
        - Dependencies between todo tasks
        - Sprint dates and a simple timeline
        - Project Vision, target users and user journeys as their own sections

        Polish
        - Auto-layout and grouping on the map
        - Filter the file view by category, status or item type
        - Dark mode

    - Won't

        - Real-time collaboration
        - Code generation from the plan
        - Integrations (GitHub, Linear, Figma)
        - Mobile app
        - Templates beyond web and (as a Could) game
        - Editor for user-created templates and item types
        - Teams, roles, permissions and payments
        - Automatic generation of a whole plan from an idea

- AI

    - How will you use ai in your project? (Tools, methods etc)

      AI is used in two ways, as help while developing and (as a Could) as a feature in the product.

      AI during development

      AI may be used during development for:

        - Ideation
        - planning
        - Code explanations and problem solving
        - Generating test cases
        - Documentation
        - Reflection and evaluation

      Claude Code may be used for testing, problemsolving etc. (will be well documented)

      AI inside the product
      I put the use of an Ai API as a could becuase i don't want it to take too much time from the base project. i am fully planning to make it work but it is not part of the MVP and the things in should take prio over the Ai APi.

        - "Analyse my plan": gives suggestions, for example "you have a login page but no password reset". The API key stays in the backend.
        - "Create a viable sprint plan": Take the created structure of components and create sprints to work from.

### Detailed plan

Fill out this part of the project plan ONLY after you got an OK from the examinator.

- MVP

    - Describe the MVP

      The MVP is the Must list from the initial idea: the smallest version of the project that still delivers the core idea of the plan where everything is connected. A user can:

        - register, log in and log out (Supabase Auth)
        - create, edit, delete and list their own projects, and only see their own data
        - create a project from the web development template, with the categories pages, components, functions, data, design, assets, authentication, testing, tech stack, MVP and project description
        - create, edit, delete and view items in each category, with a status (planned / in progress / done)
        - connect items with typed relationships (for example "belongs to", "triggers", "uses", "depends on"), where Zod only allows the combinations that the template permits
        - see all items in a "File" view, grouped by category
        - see the project as an interactive relationship map in React Flow
        - see a progress overview (planned vs completed, per category and total)

      The MVP is deployed (Vercel + Heroku, or backup host), validated by the backend, and protected so that one user can never reach another user's data. The todo list, sprints, impact view, warnings and everything else in Should and Could are not part of the MVP.

- Definition of Done

    - What criterias needs to be completed or fulfilled to make your project considered finished? (tests, reviewed, deployed, etc)

      The project is finished when all of the following are true:

        - **Features:** Everything in the Must list works, including both the File view and the relationship map, which show the same data, and the Should items that fit in the time are finished. Anything not finished is listed as not done in the personal evaluation.
        - **Deployed:** The frontend is deployed on Vercel and the backend on Heroku (or the backup host), and the live version works end to end (register, create a project, add items, connect them, see the map and the progress), tested from a different device.
        - **Tests:** Automated tests for the core logic pass: relationship rules, progress calculation and ownership checks (and warnings, if they are built). A test with two users confirms that one user cannot read or change the other's data.
        - **Code review and security check:** All code is read through and understood, including AI-generated code. The checklist covers: Row Level Security is enabled with working policies, the backend checks ownership on every route, all input goes through Zod, no secrets are committed (environment variables only), and the API key for the AI service (if used) stays in the backend.
        - **Documentation:** The README explains how to install, configure and run the project. The documentation of AI use is filled in under Result.
        - **Per feature:** A feature counts as done when it works in the browser, validates its input, shows loading and error states, and has been reviewed.

- System architecture

    - Describe the system architecture and choices

      The project has three parts:React frontend, Express backend, and Supabase.
    
        Req flow visualization:
        <img width="581" height="327" alt="Screenshot 2026-10-12 at 11 51 13" src="https://github.com/user-attachments/assets/2cb68999-2112-46b1-b27b-8f95ed1a31ee" />


      **Request flow.** The user logs in through Supabase Auth in the frontend. Every call to the API sends the Supabase access token. Express verifies the token and reads the user id -> validates the request body with Zod -> checks that the user owns the project the request is about -> runs the logic -> Prisma used to read or write the database.

      **Data model.** The main tables are projects, items, relationships, tasks and sprints. Item types and relationship types come from a template. A template is defined in code in the backend: a list of item types, relationship types and which combinations are allowed. The web template is one such definition, and a game template would be another, which keeps a game template possible later without a rewrite. A project stores which template it uses (for example "web"). For a relationship, the backend looks up the type of the source and target items and Zod checks that the combination is allowed by the template. A template already has the "core" structure expected for a type of project.

      **Choices and why**

        - **React Flow:** One of the core features is a map of nodes and connections. React Flow provides dragging, zooming and custom nodes, which saves time and lets me focus on the logic.
        - **Zod:** One place that defines the shape of items, relationships and tasks, and the relationship rules. The same schemas can be reused for forms in the frontend.
        - **Prisma:** Typed database access, schema and migrations in code. Together with Zod and TypeScript it gives matching types from validated input to saved data.
        - **Supabase:** Authentication, PostgreSQL, Storage for inspiration images, and Row Level Security. Constraints, foreign keys and enums in the database add a second layer of validation.
        - **Express in between:** Prisma connects directly to the database and bypasses Row Level Security. Because of that ownership is checked in Express on every route and Row Level Security is kept as a safety net: it is enabled on every table with policies for the user's own data, so nobody can read data through Supabase's public API with the anon key.
        - **Hosting:** Vercel for the frontend and Heroku for the backend. Cost is checked in the first sprint, with Render or Railway as backup.
        - **One repository** with `frontend/` and `backend/`, deployed separately.
        - **AI (Could):** The backend calls the AI API, so the key never reaches the browser.

- Sprint Plan

    - Break the project into sprints. For each sprint: what is the goal, and what tasks or Moscow parts belong to it?

      The project has 5 active programming weeks, planned as 5 sprints of one week each. The MVP (Must) is finished and deployed by the end of sprint 4. The tool is deployed in every sprint, so deployment problems show up early. Tests are written in the sprint where the logic is built. (Forces me to think about tests that i have a tendency to forget/postpone). AI use is documented as I go.

      **Sprint 1: Foundation and first deploy**
      Goal: Login works end to end in the deployed setup, and the database and API skeleton are in place.
        - Set up the repository (`frontend/`, `backend/`), TypeScript, Vitest and environment variables
        - Create the Supabase project, check Heroku cost and decide on the host (backup: Render or Railway)
        - Prisma schema for projects, items, relationships, tasks and sprints, first migration, constraints and enums
        - Row Level Security enabled on all tables with ownership policies
        - Register, log in and log out in the frontend (Supabase Auth)
        - Express skeleton: token verification middleware, Zod validation middleware, error handling
        - Deploy frontend and backend (Must: Delivery)
        - Wireframes in Figma, and a small React Flow prototype with mock data to test the library early

      **Sprint 2: Projects, template and items**
      Goal: A user can create a project from the web template and manage items in every category.
        - Project CRUD with ownership checks (Must: Account and projects)
        - Generic data model and the web development template defined in code in the backend (Must: Template and items)
        - Item CRUD for every category, with status and Zod validation per item type
        - "File" view of all items, grouped by category
        - Tests for ownership checks, including a test with two users

      **Sprint 3: Relationships and the map**
      Goal: Items can be connected with allowed relationships, and the project is shown as a map.
        - Create and delete typed relationships (Must: Relationships and map)
        - Relationship rules in Zod, using the item types looked up by the backend
        - Visual relationship map in React Flow, showing items as nodes and relationships as edges
        - Show an item's connections in the file view and the item detail view
        - Tests for the relationship rules

      **Sprint 4: Progress, finished MVP and the start of Should**
      Goal: The MVP is complete and deployed, and the planning tools in Should are started.
        - Progress overview, per category and total (Must: Progress and tasks)
        - Go through the Must list and Delivery items (README, environment variables, error handling), fix bugs, deploy the MVP
        - Tests for the progress calculation
        - Create items and connections from the map and save node positions
        - Todo list with create, edit, complete and delete
        - Sprints: create a sprint and assign tasks to it

      **Sprint 5: Understanding the plan, quality and finishing**
      Goal: The most valuable Should items are finished, and the project meets the Definition of Done.
        - Impact view
        - Warnings for overlooked things, with tests
        - Link tasks to items, mark items as part of the MVP
        - Filter the map, search items (first to cut if time is short)
        - Loading and error states, confirmation before deleting, responsive layout
        - Code review and security check, final README, documentation of AI use, personal evaluation
        - Could (only if time is left, in this order): game template, AI analysis, the rest of the Could list

      **Cut line.** If time runs short, items are cut from the bottom: Could first, then search, filter, MVP marking and the responsive layout. The Must list and the quality items (tests, security check) are not cut.

- Risks & Mitigations

    - Describe risks that could be a hazard to this project
    - For each risk, is there a plan B?

        - **Too little time for the whole scope**  Mitigation: strict planning, time management and a tightly controlled scope. MoSCoW with a clear cut line, the MVP finished by the end of sprint 4, and a review at the end of every sprint. ***Plan B:*** cut Should items from the bottom, and leave the Could items for later.
        - **Prisma and Supabase are harder to set up than expected** (connection strings, migrations, the Supabase-managed users table). Mitigation: do it in sprint 1 and start with a small spike. Plan B: let Express use the Supabase client for database queries (Zod and the ownership checks stay the same).
        - **A user can reach someone else's data** because of unexpected security holes caused by prisma, zod or supabase Mitigation: ownership checked in one shared middleware or helper, Row Level Security as a safety net, and a test with two users. A security check is part of DOD to make sure security is tight. Plan B: tighten the policies and remove routes that are not covered by tests.
        - **React Flow takes longer to learn or is slow.** Mitigation: prototype with dummy data in sprint 1. Plan B: a simpler map, for example with automatic positions and no drag-and-drop.
        - **The generic template model becomes too complex.** Mitigation: build the web template first and keep the model simple. Plan B: skip the template mechanism and write the web item types, relationship types and rules directly in the code (fixed enums and Zod schemas). A game template would then need a refactor.
        - **Heroku cost or availability.** Mitigation: check in sprint 1. Plan B: Render or Railway.
        - **Deployment, CORS or environment problems late in the project.** Mitigation: deploy in sprint 1 and in every sprint after.
        - **The AI API takes too much time or costs money.** Mitigation: it is a Could. Plan B: skip it, since the rule-based warnings in Should cover part of the same need.
        - **AI tools run out of tokens or give wrong answers.** Mitigation: small steps, review all generated code, commit often. Plan B: continue manually or with another tool, and document the situation.
        - **Lost work or illness.** Mitigation: commit to GitHub often and keep the sprint tasks small. Plan B: cut scope.


