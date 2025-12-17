const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- 1. GET ALL PROPERTIES (Public) ---
exports.getAllProperties = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { status, page = 1, limit = 50 } = req.query;
    
    // Build the where clause for filtering
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const properties = await prisma.property.findMany({
      where,
      include: {
        // REMOVED "images: true" because it's fetched automatically!
        owner: { 
          select: { name: true, email: true } 
        },
        propertyType: true 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Calculate map data for the properties
    const validProperties = properties.filter(p => p.latitude && p.longitude);
    const mapData = validProperties.length > 0 ? {
      latMean: validProperties.reduce((sum, p) => sum + p.latitude, 0) / validProperties.length,
      longMean: validProperties.reduce((sum, p) => sum + p.longitude, 0) / validProperties.length,
      depth: 0.1
    } : null;
    
    res.json({
      success: true,
      message: 'Properties fetched successfully',
      data: {
        properties: properties,
        pagination: {
          page: 1,
          limit: properties.length,
          total: properties.length,
          pages: 1,
          hasNext: false,
          hasPrev: false
        },
        maps: mapData
      }
    });
  } catch (error) {
    console.error("❌ GET ERROR:", error); 
    res.status(500).json({ 
      success: false,
      message: 'Error fetching properties', 
      details: error.message 
    });
  }
};

// --- 2. CREATE A PROPERTY (Protected) ---
exports.createProperty = async (req, res) => {
  try {
    const ownerId = req.user.id; 

    // ✅ FIX: Extract the images array from the request body
    const { title, description, price, type, bedrooms, bathrooms, address, images } = req.body; 

    const propertyCode = `PROP-${Date.now()}`;
    const typeValue = type || "APARTMENT"; 

    const newProperty = await prisma.property.create({
      data: {
        code: propertyCode,
        title,
        description,
        price: parseFloat(price),
        bedrooms: parseInt(bedrooms) || 1,
        bathrooms: parseInt(bathrooms) || 1,
        
        // ✅ FIX: Save the images array to the database
        images: images || [], // Ensure images is saved (it's likely a JSON/String array field)
        
        owner: {
          connect: { id: ownerId }
        },
        // ... (rest of the data is the same)
        propertyType: {
          connectOrCreate: {
            where: { code: typeValue },
            create: {
              code: typeValue,
              name: typeValue 
            }
          }
        },

        address: address || "No Address Provided",
        city: "Kuala Lumpur",
        state: "Wilayah Persekutuan",
        country: "Malaysia",
        zipCode: "50000",
        latitude: 3.140853,
        longitude: 101.693207
      }
    });

    res.status(201).json({
      message: "Property listing created successfully!",
      property: newProperty
    });

  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
};



// --- 3. GET MY PROPERTIES (Protected) ---
exports.getMyProperties = async (req, res) => {
  try {
    const ownerId = req.user.id; 

    const properties = await prisma.property.findMany({
      where: {
        ownerId: ownerId, 
      },
      // --- REMOVE THE 'INCLUDE' BLOCK COMPLETELY ---
      // include: {
      //   images: true, // This caused the crash because it expects a related model
      //   owner: { 
      //     select: { name: true, email: true } 
      //   },
      //   propertyType: true 
      // },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // ... (rest of the function remains the same, including the res.json block)
    res.json({
      success: true,
      message: "My properties fetched successfully",
      data: {
        properties: properties,
        pagination: { page: 1, limit: properties.length, total: properties.length, pages: 1 } 
      }
    });

  } catch (error) {
    console.error("❌ GET MY PROPERTIES ERROR:", error); 
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user properties', 
      details: error.message 
    });
  }
};

// --- 4. GET PROPERTY BY ID (Public) ---
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL parameters

    const property = await prisma.property.findUnique({
      where: { id: id },
      include: {
        // Include related data needed for the details page
        owner: {
          select: { id: true, name: true, email: true, phone: true }
        },
        propertyType: true,
        // Assuming images are stored directly, but including this for safety
        // If your images are stored in a separate table:
        // images: true,
      }
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({
      success: true,
      message: 'Property fetched successfully',
      data: property
    });

  } catch (error) {
    console.error("❌ GET PROPERTY BY ID ERROR:", error); 
    res.status(500).json({ 
      success: false,
      message: 'Error fetching property details', 
      details: error.message 
    });
  }
};

// --- 5. LOG PROPERTY VIEW (Public) ---
exports.logPropertyView = async (req, res) => {
  try {
    const { id } = req.params; // Get the Property ID

    // Create a PropertyView record instead of updating non-existent viewCount
    const propertyView = await prisma.propertyView.create({
      data: {
        propertyId: id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || 'Unknown',
        userId: req.user?.id || null
      }
    });

    res.json({
      success: true,
      message: 'Property view logged successfully',
      data: { viewId: propertyView.id }
    });

  } catch (error) {
    // We log the error but don't fail the whole request, as logging a view is secondary
    console.error("❌ LOG PROPERTY VIEW ERROR:", error); 
    res.status(500).json({ 
      success: false,
      message: 'Failed to log property view', 
      details: error.message 
    });
  }
};

// --- 6. UPDATE A PROPERTY (Protected) ---
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params; // Property ID from the URL
    const ownerId = req.user.id; // Authenticated User ID from the token
    const updateData = req.body; // Data sent from the frontend

    // 1. Check if the property exists and belongs to the authenticated user
    const property = await prisma.property.findUnique({
      where: { id: id },
    });

    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }

    // Check if user is admin or the owner of the property
    const isAdmin = req.user?.role === 'ADMIN';
    if (property.ownerId !== ownerId && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to edit this property' 
      });
    }

    // 2. Prepare data for update
    const dataToUpdate = {};
    // Safely parse price if it exists
    if (updateData.price) {
      dataToUpdate.price = parseFloat(updateData.price);
    }
    // Safely parse bedrooms/bathrooms if they exist
    if (updateData.bedrooms) {
        dataToUpdate.bedrooms = parseInt(updateData.bedrooms);
    }
    if (updateData.bathrooms) {
        dataToUpdate.bathrooms = parseInt(updateData.bathrooms);
    }

    // Copy all other fields (title, description, address, images, etc.)
    const allowedFields = [
      'title', 'description', 'address', 'city', 'state', 'zipCode', 
      'country', 'areaSqm', 'furnished', 'isAvailable', 'images', 
      'latitude', 'longitude', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    });

    // 3. Perform the update
    const updatedProperty = await prisma.property.update({
      where: { id: id },
      data: dataToUpdate,
      include: {
        propertyType: true,
      }
    });

    res.json({
      success: true,
      message: "Property updated successfully!",
      data: updatedProperty
    });

  } catch (error) {
    console.error("❌ UPDATE PROPERTY ERROR:", error); 
    res.status(500).json({ 
      success: false,
      message: 'Error updating property', 
      details: error.message 
    });
  }
};

// --- 7. DELETE A PROPERTY (Protected) ---
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params; // Property ID from the URL
    const ownerId = req.user.id; // Authenticated User ID

    // 1. Check if the property exists and belongs to the authenticated user
    const property = await prisma.property.findUnique({
      where: { id: id },
      // CRITICAL: We also need to check for dependent records (like Leases)
      // If the schema is set to RESTRICT (which it is), the delete will fail 
      // if any Lease records are still attached. We typically handle this 
      // by first checking for dependents or by updating the Prisma schema.
    });

    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }

    if (property.ownerId !== ownerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to delete this property' 
      });
    }

    // 2. Perform the deletion
    await prisma.property.delete({
      where: { id: id },
    });

    res.json({
      success: true,
      message: "Property deleted successfully!",
    });

  } catch (error) {
    // If the error is a foreign key violation (23001), inform the user
    if (error.code === 'P2003' || (error.message && error.message.includes('Foreign key constraint failed'))) {
        return res.status(409).json({
            success: false,
            message: "Cannot delete property: It is linked to existing leases, bookings, or reviews. Please delete dependent records first.",
            details: error.message
        });
    }
    
    console.error("❌ DELETE PROPERTY ERROR:", error); 
    res.status(500).json({ 
      success: false,
      message: 'Error deleting property', 
      details: error.message 
    });
  }
};