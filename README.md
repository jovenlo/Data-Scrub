# Data Scrub

Data Scrub is a web application built using Next.js and Firebase Studio. It provides tools for data cleaning, deduplication, and visualization. The application is designed to help users manage and analyze their data efficiently.

## Features

- **File Upload**: Upload data files for processing.
- **Data Deduplication**: Automatically identify and remove duplicate rows from datasets.
- **Data Visualization**: Generate interactive visualizations to explore your data.
- **Customizable Components**: Includes a library of reusable UI components such as buttons, tables, charts, and more.
- **AI Integration**: Leverages AI to generate data reports and assist in data cleaning tasks.

## Project Structure

The project is organized as follows:

- `src/app/`: Contains the main application pages and layouts.
  - `page.tsx`: The homepage of the application.
  - `dashboard/`: Includes the dashboard and visualization pages.
- `src/components/`: Reusable UI components.
  - `ui/`: A collection of UI elements like buttons, forms, and charts.
- `src/ai/`: AI-related utilities and flows for data processing.
- `src/hooks/`: Custom React hooks for specific functionalities.
- `src/lib/`: Utility functions used across the application.

## Getting Started

### Prerequisites

- Node.js and npm installed on your system.
- A Google API key for accessing AI and data processing features.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jovenlo/Data-Scrub.git
   cd Data-Scrub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Google API key:
   ```env
   GOOGLE_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000` (or the specified port).

## Usage

1. Navigate to the homepage to upload your data files.
2. Use the dashboard to view and clean your data.
3. Generate visualizations to analyze your data.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or new features.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
