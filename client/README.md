# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Application routes

The client uses React Router browser-history routes:

- `/` - event discovery
- `/events/:eventId` - event details
- `/my-events` and `/registrations/:registrationId` - visitor registrations
- `/profile` - visitor profile
- `/admin`, `/admin/events`, `/admin/registrations`, `/admin/registrations/:registrationId`, `/admin/events/:eventId/registrations`, `/admin/trash`, and `/admin/scanner` - administrator pages

Legacy query-string page URLs are redirected to their path-based equivalents. The
`mode=admin` query parameter is retained only to indicate that an administrator is
viewing the visitor experience.

When deploying the client, configure the static host to serve `index.html` for
unknown paths so direct links and page refreshes on nested routes reach the SPA.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
