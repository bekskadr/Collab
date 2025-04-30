# Collaborative Document Editor

A real-time collaborative document editing application built with React and Firebase.

## Features

- Real-time document editing with Draft.js
- Document sharing and collaboration
- Comments section for discussions
- Version history tracking
- Drawing tool for visual annotations
- Dark mode support
- User authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/collaborative-doc-editor.git
   cd collaborative-doc-editor
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure Firebase
   - Create a Firebase project in the Firebase Console
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase configuration to `src/firebase.js`

4. Start the development server
   ```
   npm start
   ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run test:coverage`

Runs all tests and generates a coverage report showing the percentage of code covered by tests.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Testing

The application includes a comprehensive testing suite using Jest and React Testing Library. Tests are organized into the following categories:

### Repository Tests
- DocumentRepositoryTest: Tests for document CRUD operations
- CommentRepositoryTest: Tests for comment functionality
- VersionHistoryTest: Tests for version history tracking

### Component Tests
- ComponentRenderingTest: Tests for UI component rendering
- DrawingToolTest: Tests for drawing functionality

### Authentication Tests
- UserAuthenticationTest: Tests for user registration, login, and authentication

### Running Tests
To run all tests:
```
npm test
```

To run a specific test file:
```
npm test -- DocumentRepository.test.js
```

To generate a test coverage report:
```
npm run test:coverage
```

### Test Documentation
For detailed test documentation, refer to the `Test_Documentation.md` file, which provides tables of all test cases with their descriptions, preconditions, steps, and expected results.

## Project Structure

- `/src/components`: React components organized by feature
- `/src/contexts`: React context providers
- `/src/services`: Firebase service integrations
- `/src/hooks`: Custom React hooks
- `/src/__tests__`: Test files for components and services

## Technologies Used

- React
- Firebase (Authentication, Firestore, Storage)
- Draft.js for rich text editing
- Styled-components for styling
- React Router for navigation
- Jest and React Testing Library for testing
