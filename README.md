# Media Service

This project is a media service designed to handle media files and related operations.

## Features

- Upload media files
- Retrieve media files
- Delete media files
- Update media metadata

## Technologies

- **Backend**: Node.js, Express
- **Storage**: Cloud storage (AWS S3 or similar)
- **Environment Management**: dotenv

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd media-service
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and configure the following:

   ```
   PORT=3002
   DATABASE_URL=<your-database-url>
   STORAGE_ACCESS_KEY=<your-storage-access-key>
   STORAGE_SECRET_KEY=<your-storage-secret-key>
   STORAGE_BUCKET=<your-storage-bucket>
   ```

4. Run the application:
   ```bash
   npm start
   ```

## License

This project is licensed under the MIT License.
