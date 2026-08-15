# Kaggle Project: Career Bridge

## Goal
Build a PDF-only resume + job-description analyzer that helps a user understand fit, gaps, and next steps.

## Scope
- Input: one resume PDF
- Input: one job description pasted as text
- Output: match score, top fit reasons, top gaps, and resume improvement suggestions
- UI: chat-style web app

## MVP Flow
1. Upload resume PDF
2. Paste a job description
3. Extract structured resume fields
4. Compare resume against job description
5. Show score, gaps, and suggested improvements

## Recommended Architecture
- Frontend: Next.js app
- Parsing: client-side PDF text extraction or server-side parsing
- Analysis: two-step pipeline
  - Step 1: extract structured resume data
  - Step 2: generate match analysis and recommendations

## Build Notes
- Keep v1 narrow
- Avoid multi-resume support
- Avoid multi-job comparison
- Keep explanations short and scannable

