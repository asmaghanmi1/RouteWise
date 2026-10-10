\# RouteWise â€” Car Route Planning Web Application



\[!\[CI](https://github.com/asmaghanmi1/RouteWise/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/asmaghanmi1/RouteWise/actions/workflows/ci.yml)

\[!\[Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript-blue)](https://react.dev/)

\[!\[Backend](https://img.shields.io/badge/Backend-Flask-black)](https://flask.palletsprojects.com/)



\*\*RouteWise\*\* is a full-stack web application that helps users plan car journeys between two locations. It combines a React and TypeScript frontend with a Flask REST API, external geocoding and routing services, automated tests, and continuous integration.



\*\*Live application:\*\* https://route-wise-ochre.vercel.app/



\*\*Backend API:\*\* https://routewise-mbyc.onrender.com/



\*\*Source code:\*\* https://github.com/asmaghanmi1/RouteWise



\## Table of Contents



\* \[Features](#features)

\* \[Architecture](#architecture)

\* \[Technology Stack](#technology-stack)

\* \[Project Structure](#project-structure)

\* \[Getting Started](#getting-started)

\* \[Environment Configuration](#environment-configuration)

\* \[API Reference](#api-reference)

\* \[Testing and Code Quality](#testing-and-code-quality)

\* \[Deployment](#deployment)

\* \[Security and Limitations](#security-and-limitations)

\* \[Future Improvements](#future-improvements)



\## Features



\* \*\*Route planning:\*\* calculate a driving route between an origin and a destination.

\* \*\*Geocoding:\*\* convert place names into geographic coordinates using Geoapify.

\* \*\*Route calculation:\*\* retrieve road-route information from OSRM.

\* \*\*Interactive frontend:\*\* built with React and TypeScript.

\* \*\*REST API:\*\* a Flask backend validates requests and communicates with external services.

\* \*\*Input validation:\*\* reject malformed requests, empty locations, and excessively long place names.

\* \*\*Response validation:\*\* check routing-service data before processing it.

\* \*\*Health monitoring endpoint:\*\* verify whether the backend API is responding.

\* \*\*Automated quality checks:\*\* run backend tests, frontend linting, and a production build through GitHub Actions.



\## Architecture



```mermaid

flowchart TD

&#x20;   U\[User] --> FE\[React and TypeScript Frontend]

&#x20;   FE -->|HTTP JSON| API\[Flask REST API]

&#x20;   API -->|Geocode locations| GEO\[Geoapify Geocoding API]

&#x20;   API -->|Calculate driving route| OSRM\[OSRM Routing API]

&#x20;   GEO --> API

&#x20;   OSRM --> API

&#x20;   API -->|Route response| FE

&#x20;   FE -->|Display results| U



&#x20;   GH\[GitHub Repository] --> CI\[GitHub Actions CI]

&#x20;   CI --> T\[Backend Tests]

&#x20;   CI --> L\[Frontend ESLint]

&#x20;   CI --> B\[Frontend Production Build]

```



\### Request lifecycle



1\. The user enters an origin and a destination in the frontend.

2\. The frontend sends a JSON request to the Flask API.

3\. The backend validates the submitted data.

4\. Geoapify resolves the place names into geographic coordinates.

5\. OSRM calculates the driving route using those coordinates.

6\. The backend validates the routing response and returns the result to the frontend.



The frontend and backend are deployed separately, allowing each component to be maintained and deployed independently.



\## Technology Stack



| Component              | Technologies                |

| ---------------------- | --------------------------- |

| Frontend               | React, TypeScript, Vite     |

| Backend                | Python, Flask               |

| API communication      | REST, HTTP, JSON            |

| Geocoding              | Geoapify                    |

| Routing                | OSRM                        |

| Backend testing        | pytest                      |

| Frontend quality       | ESLint, TypeScript compiler |

| Continuous integration | GitHub Actions              |

| Frontend hosting       | Vercel                      |

| Backend hosting        | Render                      |

| Version control        | Git and GitHub              |



\## Project Structure



```text

RouteWise/

â”œâ”€â”€ .github/

â”‚   â””â”€â”€ workflows/

â”‚       â””â”€â”€ ci.yml

â”œâ”€â”€ backend/

â”‚   â”œâ”€â”€ tests/

â”‚   â”‚   â””â”€â”€ test\_app.py

â”‚   â”œâ”€â”€ app.py

â”‚   â”œâ”€â”€ requirements.txt

â”‚   â””â”€â”€ requirements-dev.txt

â”œâ”€â”€ frontend/

â”‚   â”œâ”€â”€ src/

â”‚   â”œâ”€â”€ public/

â”‚   â”œâ”€â”€ package.json

â”‚   â”œâ”€â”€ package-lock.json

â”‚   â””â”€â”€ vite.config.ts

â”œâ”€â”€ .gitignore

â””â”€â”€ README.md

```



\## Getting Started



\### Prerequisites



Install the following tools:



\* Python 3.12

\* Node.js 22 and npm

\* Git



An active Geoapify API key is required for geocoding requests. Routing requests also depend on the availability of the configured OSRM service.



\### 1. Clone the repository



```powershell

git clone https://github.com/asmaghanmi1/RouteWise.git

cd RouteWise

```



\### 2. Configure and start the backend



Create a virtual environment:



```powershell

cd backend

python -m venv .venv

```



Activate it in PowerShell:



```powershell

.\\.venv\\Scripts\\Activate.ps1

```



Install the backend dependencies:



```powershell

python -m pip install -r requirements.txt

```



Configure the Geoapify API key for the current PowerShell session:



```powershell

$env:GEOAPIFY\_API\_KEY = "YOUR\_GEOAPIFY\_API\_KEY"

```



Replace the placeholder with your own key. Never commit a real API key to Git.



Start the Flask application:



```powershell

python app.py

```



Unless the application is configured differently, the local API is expected to be available at:



`http://127.0.0.1:5000`



\### 3. Start the frontend



Open a second PowerShell terminal from the repository root:



```powershell

cd C:\\Users\\Asmag\\RouteWise\\frontend

npm ci

npm run dev

```



Open the local URL printed by Vite in your terminal.



The frontend must be configured to send API requests to the local backend during local development. The deployed frontend currently uses the Render backend URL.



\## Environment Configuration



The backend reads the Geoapify key from an environment variable:



| Variable           | Purpose                                      | Required                    |

| ------------------ | -------------------------------------------- | --------------------------- |

| `GEOAPIFY\_API\_KEY` | Authenticates geocoding requests to Geoapify | Yes, for route calculations |



For production, configure this variable in the backend hosting provider's environment settings.



For local development, PowerShell's `$env:` syntax sets the variable for the current session. If you open a new terminal, configure it again.



\*\*Security rules:\*\*



\* Do not commit `.env` files containing real credentials.

\* Do not expose the Geoapify key in frontend source code.

\* Do not paste API keys into screenshots, issue reports, or public documentation.

\* If a key is accidentally published, revoke or rotate it.



\## API Reference



\### Health check



`GET /api/health`



Checks whether the backend is responding.



Example:



```http

GET https://routewise-mbyc.onrender.com/api/health

```



Expected response:



```json

{

&#x20; "service": "RouteWise API",

&#x20; "status": "ok"

}

```



\### Calculate a route



`POST /api/route`



Request body:



```json

{

&#x20; "origin": "Tunis, Tunisia",

&#x20; "destination": "Sousse, Tunisia"

}

```



The backend validates the input, geocodes both locations, and requests a route from OSRM.



Possible error categories include invalid input (`400`), an unresolved location (`404`), and external-service or configuration failures (`502` or `503`), depending on the failure.



The exact successful response structure is defined by the backend implementation.



\## Testing and Code Quality



RouteWise includes automated backend tests covering the health endpoint, invalid requests, input validation, and routing-response validation.



\### Run backend tests



From the repository root:



```powershell

python -m pip install -r backend/requirements-dev.txt

python -m pytest backend/tests -v

```



\### Run frontend linting



```powershell

npm --prefix .\\frontend run lint

```



\### Build the frontend



```powershell

npm --prefix .\\frontend run build

```



\### Continuous integration



The GitHub Actions workflow in `.github/workflows/ci.yml` runs on pushes to `master` and pull requests targeting `master`.



It contains two jobs:



1\. \*\*Backend tests:\*\* install Python dependencies and execute pytest.

2\. \*\*Frontend checks:\*\* install locked npm dependencies, run ESLint, and compile the production frontend.



Workflow results are available in \[GitHub Actions](https://github.com/asmaghanmi1/RouteWise/actions).



\## Deployment



\### Frontend â€” Vercel



The frontend is deployed at:



https://route-wise-ochre.vercel.app/



\### Backend â€” Render



The backend API is deployed at:



https://routewise-mbyc.onrender.com/



The backend must have `GEOAPIFY\_API\_KEY` configured in its environment settings. CORS must allow the deployed frontend origin.



\### Continuous integration vs. deployment



GitHub Actions validates the code through tests, linting, and a production build. This workflow is a \*\*continuous integration (CI)\*\* pipeline.



Vercel and Render host the application components. Automatic deployment after a Git push depends on each hosting service's deployment configuration and is separate from the CI checks documented here.



\## Security and Limitations



\* Route calculations depend on third-party geocoding and routing services.

\* Public routing infrastructure may impose rate limits, experience outages, or change its availability.

\* The backend validates inputs and external routing responses, but external service availability cannot be guaranteed.

\* The health endpoint checks backend responsiveness; it does not by itself guarantee that every external dependency is healthy.

\* API keys must remain in backend environment configuration rather than frontend code or version control.



\## Future Improvements



Potential next steps include:



\* Add integration tests using mocked Geoapify and OSRM responses.

\* Add frontend tests for important user interactions.

\* Introduce structured logging and improved external-service monitoring.

\* Add request timeouts, retry policies, and clearer user-facing error messages where appropriate.

\* Improve API documentation and response schemas.

\* Add automated deployment checks and end-to-end tests.

\* Evaluate caching and service usage limits for more reliable operation.



\## Author



Developed by \*\*Asma Ghanmi\*\* as a full-stack web application project, with an emphasis on API integration, validation, testing, deployment, and continuous integration.



\## License



No license has been specified in this repository yet. Unless a license is added, reuse and redistribution remain subject to the applicable copyright rules.
