# Makefile for bitter-sql

.PHONY: help install build clean test test-watch test-e2e lint lint-fix format format-check check publish dev

# Default target
help:
	@echo "Available targets:"
	@echo "  install       - Install dependencies"
	@echo "  build         - Build TypeScript source"
	@echo "  clean         - Remove build artifacts"
	@echo "  test          - Run all tests with coverage"
	@echo "  test-e2e      - Run end-to-end tests"
	@echo "  lint          - Run ESLint"
	@echo "  lint-fix      - Fix ESLint issues"
	@echo "  format        - Format code with Prettier"
	@echo "  format-check  - Check code formatting"
	@echo "  check         - Run all quality checks (lint, format, test)"
	@echo "  publish       - Build and publish to npm"
	@echo "  dev           - Run CLI in development mode"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Build TypeScript
build:
	@echo "Building TypeScript source..."
	npm run build

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	npm run clean
	rm -rf coverage test-results playwright-report logs
	find . -name "*.db" -not -path "./node_modules/*" -delete

# Run tests
test: build
	@echo "Running tests with coverage..."
	npm test

# Run E2E tests
test-e2e: build
	@echo "Running end-to-end tests..."
	npm run test:e2e

# Lint code
lint:
	@echo "Running ESLint..."
	npm run lint

# Fix linting issues
lint-fix:
	@echo "Fixing ESLint issues..."
	npm run lint:fix

# Format code
format:
	@echo "Formatting code with Prettier..."
	npm run format

# Check formatting
format-check:
	@echo "Checking code formatting..."
	npm run format:check

# Run all quality checks
check: clean lint format-check test
	@echo "All quality checks passed!"

# Publish to npm
publish: check
	@echo "Publishing to npm..."
	npm publish

# Development mode
dev:
	@echo "Running CLI in development mode..."
	npm run dev

# Quick build and test
quick: build test
	@echo "Quick build and test complete!"

# Setup development environment
setup: install
	@echo "Setting up development environment..."
	cp .env.example .env
	npx husky install
	@echo "Development environment ready!"

# Clean and reinstall
reinstall: clean
	@echo "Removing node_modules..."
	rm -rf node_modules package-lock.json
	@echo "Reinstalling dependencies..."
	npm install

# Version bump helpers
version-patch:
	npm version patch

version-minor:
	npm version minor

version-major:
	npm version major

# Generate documentation
docs:
	@echo "Generating documentation..."
	npx typedoc src/index.ts --out docs

# Clean test databases
clean-db:
	@echo "Cleaning test databases..."
	find tests -name "*.db" -delete
	find . -name "*.db" -not -path "./node_modules/*" -delete

# Full clean (including dependencies)
distclean: clean
	@echo "Performing full clean..."
	rm -rf node_modules package-lock.json dist coverage logs
	@echo "Full clean complete!"
