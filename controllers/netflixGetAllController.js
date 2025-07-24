
const NetflixTicket = require('../models/netflixUpdateSchema.js')




exports.postticketsdata = async (req, res) => {
  try {
    // Validate required fields
    // if (!req.body.CM_email || !req.body.CM_name) {
    //   return res.status(400).json({ 
    //     success: false,
    //     error: 'CM_email and CM_name are required fields' 
    //   });
    // }

    // Create ticket data object
    const ticketData = {
      ticketKey: req.body.ticketKey,
      created: req.body.created || new Date(),
      updated: req.body.updated || new Date(),
      CM_name: req.body.CM_name,
      CM_email: req.body.CM_email,
      cm_region: req.body.cm_region || '',
      AM_name: req.body.AM_name || ''
    };

    // Save the ticket
    const savedTicket = await NetflixTicket.create(ticketData);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: savedTicket
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false,
        error: 'Duplicate ticket key detected' 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    // Generic server error
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
};


exports.getNetflixTickets = async (req, res) => {
  try {
    const { email, role, cm_region } = req.query; // Added cm_region here
    
    const { 
      status,
      priority,
      createdFrom, 
      createdTo, 
      updatedFrom, 
      updatedTo,
      searchText,
      page = 1,
      limit = 10
    } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    // Validate role
    if (role !== '0' && role !== '1') {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check user authorization and get user type
    let isCM = false;
    if (role === '0') {
      const cmTicket = await NetflixTicket.findOne({ CM_email: email }).select('_id');
      if (!cmTicket) {
        return res.status(404).json({ message: 'No updates are available' });
      }
      isCM = true;
    }

    // Build the base query
    let query = {};
    
    // If role is CM (0), only show their own tickets
    if (role === '0') {
      query.CM_email = email;
    }

    // Add cm_region filter if provided
    if (cm_region) {
      query.cm_region = cm_region;
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add priority filter if provided
    if (priority) {
      query.priority = priority;
    }

    // Add date range filters
    const dateFilters = {};
    if (createdFrom) {
      dateFilters.$gte = new Date(createdFrom);
    }
    if (createdTo) {
      dateFilters.$lte = new Date(createdTo);
    }
    if (Object.keys(dateFilters).length > 0) {
      query.created = dateFilters;
    }

    const updatedDateFilters = {};
    if (updatedFrom) {
      updatedDateFilters.$gte = new Date(updatedFrom);
    }
    if (updatedTo) {
      updatedDateFilters.$lte = new Date(updatedTo);
    }
    if (Object.keys(updatedDateFilters).length > 0) {
      query.updatedAt = updatedDateFilters;
    }

    // Add text search if provided (only search across existing fields)
    if (searchText) {
      query.$or = [
        { ticketID: { $regex: searchText, $options: 'i' } },
        { CM_name: { $regex: searchText, $options: 'i' } },
        { CM_email: { $regex: searchText, $options: 'i' } },
        { cm_region: { $regex: searchText, $options: 'i' } },
        { AM_name: { $regex: searchText, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await NetflixTicket.countDocuments(query);

    // If no results found for CM, return message
    if (role === '0' && total === 0) {
      return res.status(404).json({ message: 'No updates are available' });
    }

    // Fetch paginated results
    const issues = await NetflixTicket.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: issues.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: issues,
      userType: isCM ? 'CM' : 'QM'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.qmdata = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.jiraUserId || !req.body.emailId || !req.body.region) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new document
    const newCM = new CM({
      name: req.body.name,
      jiraUserId: req.body.jiraUserId,
      emailId: req.body.emailId,
      region: req.body.region,
      role:req.body.role
    });

    // Save to database
    const savedCM = await newCM.save();
    
    // Return success response
    res.status(201).json({
      message: 'CM record created successfully',
      data: savedCM
    });
  } catch (err) {
    console.error('Error creating CM record:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
};
