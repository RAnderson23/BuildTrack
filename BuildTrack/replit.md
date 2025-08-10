# ContractorPro

## Overview

ContractorPro is a construction project management application built with a modern full-stack architecture. The system enables contractors to manage projects, track expenses through automated receipt processing, and generate contracts/estimates. The application features AI-powered receipt parsing, client management, and comprehensive project tracking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui for consistent design system
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a component-based architecture with reusable UI components, custom hooks for business logic, and proper separation of concerns between presentation and data fetching layers.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit OpenID Connect (OIDC) integration with Passport.js
- **Session Management**: Express sessions with PostgreSQL storage
- **File Handling**: Multer for receipt upload processing

The backend implements a RESTful API design with middleware for authentication, request logging, and error handling. The storage layer is abstracted through interfaces to support future database migrations.

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Key Entities**:
  - Users (required for Replit Auth integration)
  - Clients (customer information)
  - Projects (construction jobs with status tracking)
  - Contracts (estimates and invoices with line items)
  - Receipts (expense tracking with AI-parsed line items)
  - Sessions (secure session storage)

The database schema supports hierarchical relationships between users, clients, projects, and their associated documents with proper foreign key constraints and cascade deletion.

### Authentication & Authorization
- **Provider**: Replit OIDC for seamless platform integration
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration
- **User Management**: Automatic user creation/updates from OIDC claims

### AI Integration
- **Service**: OpenAI GPT for receipt parsing and data extraction
- **Functionality**: Automated extraction of vendor information, dates, totals, and line items from receipt images
- **File Support**: JPEG, PNG, and PDF receipt uploads with 10MB size limits
- **Data Validation**: Structured JSON output with business rule enforcement (e.g., Home Depot Pro Xtra discount handling)

### Development & Deployment
- **Build System**: Vite for frontend bundling with hot reload support
- **Server Bundling**: esbuild for production server builds
- **Development Tools**: TypeScript compiler, Drizzle Kit, and Replit-specific tooling
- **Asset Management**: Structured upload directories with file type validation

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit OIDC identity provider
- **AI Services**: OpenAI API for receipt processing

### Key Libraries
- **Frontend**: React, TanStack Query, Radix UI, Tailwind CSS, Wouter, React Hook Form, Zod
- **Backend**: Express.js, Drizzle ORM, Passport.js, Multer, OpenAI SDK
- **Development**: Vite, TypeScript, esbuild, Drizzle Kit

### Session & Storage
- **Session Store**: connect-pg-simple for PostgreSQL session persistence
- **File Storage**: Local filesystem with organized upload directories
- **WebSocket**: ws library for Neon database connections

The application is designed for deployment on Replit with environment-specific configurations and proper build processes for both development and production environments.