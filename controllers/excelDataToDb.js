// const fs = require('fs');
// const csv = require('csv-parser');
// const path = require('path');
// const mongoose = require('mongoose');
// const CM = require('../models/cmSchema');

// async function processCSV() {
//   // Connect to MongoDB
//   await mongoose.connect('mongodb://localhost:27017/NetflixDb', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });
//   console.log('Connected to MongoDB');

//   const results = [];
//   const downloadsPath = path.join(require('os').homedir(), 'Downloads');
//   const csvFilePath = path.join(downloadsPath, 'Netflix Ticketing System  - cmdata.csv');
  
//   // Read CSV file
//   fs.createReadStream(csvFilePath)
//     .pipe(csv({
//       headers: ['name', 'jiraUserId', 'emailId', 'region', 'role'],
//       skipLines: 1 // Skip header row
//     }))
//     .on('data', (data) => {
//       // Filter out empty rows and rows without name
//       if (data.name && data.name.trim() !== '') {
//         results.push(data);
//       }
//     })
//     .on('end', async () => {
//       try {
//         // Insert data into MongoDB
//         for (const item of results) {
//           const cm = new CM({
//             name: item.name,
//             jiraUserId: item.jiraUserId,
//             emailId: item.emailId,
//             region: item.region,
//             role: parseInt(item.role) || 0 // Default to 0 if role is not provided
//           });
          
//           await cm.save();
//           console.log(`Saved: ${cm.name} with CMID: ${cm.cmid}`);
//         }
        
//         console.log('All data processed successfully');
//         await mongoose.connection.close();
//       } catch (err) {
//         console.error('Error saving data:', err);
//         await mongoose.connection.close();
//       }
//     });
// }

// // Run the processing
// processCSV().catch(err => console.error('Error in processCSV:', err));




// const fs = require('fs');
// const csv = require('csv-parser');
// const path = require('path');
// const mongoose = require('mongoose');
// const QM = require('../models/qmSchema');

// async function importQMData() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect('mongodb://localhost:27017/NetflixDb', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log('Connected to MongoDB');

//     const results = [];
//     const downloadsPath = path.join(require('os').homedir(), 'Downloads');
//     const csvFilePath = path.join(downloadsPath, 'EWS_TimeLines - Sheet3.csv');

//     // Read CSV file with role column
//     await new Promise((resolve, reject) => {
//       fs.createReadStream(csvFilePath)
//         .pipe(csv({
//           headers: ['name', 'jiraUserId', 'emailId', 'region', 'role'], // Added role
//           skipLines: 1 // Skip header row
//         }))
//         .on('data', (data) => {
//           if (data.name && data.name.trim() !== '') {
//             // Convert role to number, default to 0 if not provided
//             data.role = data.role ? parseInt(data.role) : 1;
//             results.push(data);
//           }
//         })
//         .on('end', resolve)
//         .on('error', reject);
//     });

//     // Insert data into MongoDB
//     for (const item of results) {
//       const qm = new QM({
//         name: item.name,
//         jiraUserId: item.jiraUserId,
//         emailId: item.emailId,
//         region: item.region,
//         role: item.role // Include role in the document
//       });
      
//       await qm.save();
//       console.log(`Saved: ${qm.name} with QMID: ${qm.qmid} and Role: ${qm.role}`);
//     }

//     console.log('All QM data processed successfully');
//   } catch (err) {
//     console.error('Error processing QM data:', err);
//   } finally {
//     await mongoose.connection.close();
//   }
// }

// // Run the import
// importQMData();



const mongoose = require('mongoose');
const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const NetflixTicket = require('./models/NetflixTicket'); // Assuming your schema file is here

// Google Sheets setup
const doc = new GoogleSpreadsheet('1o6yJNxEgyjgmiqCSX1sX1-qWd0l5_qOmaawT-POS5nI');

async function importSheetData() {
  try {
    // Authenticate with Google Sheets
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    // Load document and sheet
    await doc.loadInfo();
    const sheet = doc.sheetsById[154894758]; // Using the gid from your URL

    // Get all rows
    const rows = await sheet.getRows();

    // Process each row
    for (const row of rows) {
      // Map sheet columns to your schema fields
      const ticketData = {
        ticketKey: row['Issue key (ticket key)'],
        created: new Date(row['Created']),
        updated: new Date(row['Updated']),
        AM_name: row['AM_name'],
        CM_name: row['Assignee(CM name)'],
        CM_email: row['Assignee_mail(CM mail)'],
        cm_region: row['Assignee_region'] || '',
      };

      // Check if ticket already exists (using ticketKey as identifier)
      const existingTicket = await NetflixTicket.findOne({ ticketKey: ticketData.ticketKey });
      
      if (existingTicket) {
        // Update existing ticket
        await NetflixTicket.updateOne({ _id: existingTicket._id }, ticketData);
        console.log(`Updated ticket ${ticketData.ticketKey}`);
      } else {
        // Create new ticket
        const newTicket = new NetflixTicket(ticketData);
        await newTicket.save();
        console.log(`Created new ticket ${ticketData.ticketKey}`);
      }
    }

    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    mongoose.disconnect();
  }
}

importSheetData();











