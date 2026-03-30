# Dockify Frontend

## Quick Start

### Local Development

#### Using Bun
```bash
bun install
bun run dev
```

#### Using npm
```bash
npm install
npm run dev
```

The application will start at `http://localhost:3000`

### Docker

#### Build the Docker Image

```bash
docker build --platform linux/amd64 -t dockify-frontend:latest .
```

#### Run the Container

```bash
docker run -p 3000:3000 dockify-frontend:latest
```



#### Docker Compose (Full Stack) - Development

To run both frontend and backend together, use the `compose.local.yaml` file from the project root:

```bash
# Make sure you're in the root directory (parent of dockify_frontend and dockify_backend)
docker compose -f compose.local.yaml up -d
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

To rebuild the images:
```bash
docker compose -f compose.local.yaml up --build
```

To stop the services:
```bash
docker compose -f compose.local.yaml down
```

#### Docker Compose (Full Stack) - Production

To run the full stack in production, you need to push the images to Docker Hub first:

```bash
# Login to Docker Hub
docker login

# Tag and push the frontend image
docker tag dockify-frontend:latest <your-dockerhub-username>/dockify-frontend:latest
docker push <your-dockerhub-username>/dockify-frontend:latest

# Do the same for the backend, then update compose.yaml with your image references
```

Then use the production `compose.yaml` (without "local"):

```bash
docker compose up -d
```

The services will pull your images from Docker Hub automatically.


#### Docker Image Platform Warning

Configured for `linux/amd64` only!

This is the only supported mode since PyRosetta is a restriction here.



## Environment Configuration

Create a `.env.local` file for local development settings, or use a `.env` file for Docker deployments:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```


## Troubleshooting

### Module Not Found Errors

If you encounter module not found errors during build:

```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json bun.lockb
npm install
npm run build
```

### Container Architecture Mismatch

To check the architecture of a built image:

```bash
docker inspect dockify-frontend:latest | grep -i architecture
```

To ensure amd64 architecture:

```bash
docker build --platform linux/amd64 -t dockify-frontend:latest .
```

## Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── ui/          # UI component library
│   ├── results/     # Docking results components
│   └── providers/   # Context providers
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and API client
├── store/           # Zustand stores (state management)
└── types/           # TypeScript type definitions
```



