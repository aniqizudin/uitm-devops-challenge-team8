#!/usr/bin/env node

/**
 * Database Import Script: RentVerse Property Data Importer
 * Imports transformed FazWaz data into the RentVerse PostgreSQL database
 * 
 * Usage: node scripts/import-fazwaz-data.js [json-file-path]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

class RentVerseDataImporter {
    constructor() {
        this.db = new PrismaClient();
        this.importedCount = 0;
        this.errorCount = 0;
        this.errors = [];
        this.systemUserId = null;
        this.propertyTypeCache = {};
    }

    async connectDatabase() {
        try {
            await this.db.$connect();
            console.log('✅ Connected to PostgreSQL database successfully');
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
    }

    async disconnectDatabase() {
        try {
            await this.db.$disconnect();
            console.log('👋 Database disconnected');
        } catch (error) {
            console.error('Error disconnecting from database:', error.message);
        }
    }

    async getOrCreateSystemUser() {
        try {
            // Try to find existing system user
            const systemUser = await this.db.user.findFirst({
                where: {
                    email: "system@fazwaz-scraper.com"
                }
            });

            if (systemUser) {
                this.systemUserId = systemUser.id;
                console.log(`✅ Using existing system user: ${systemUser.email}`);
                return systemUser.id;
            }

            // Create new system user
            const newSystemUser = await this.db.user.create({
                data: {
                    email: "system@fazwaz-scraper.com",
                    firstName: "FazWaz",
                    lastName: "Scraper",
                    name: "FazWaz Scraper",
                    password: "scraped-data-user", // This user won't be used for login
                    role: "ADMIN", // Give admin role to handle property imports
                    isActive: true
                }
            });

            this.systemUserId = newSystemUser.id;
            console.log(`✅ Created new system user: ${newSystemUser.email}`);
            return newSystemUser.id;

        } catch (error) {
            this.errors.push(`System user creation failed: ${error.message}`);
            console.error('❌ System user creation failed:', error.message);
            return null;
        }
    }

    async getOrCreatePropertyType(propertyTypeCode) {
        if (this.propertyTypeCache[propertyTypeCode]) {
            return this.propertyTypeCache[propertyTypeCode];
        }

        try {
            // Try to find existing property type
            const propertyType = await this.db.propertyType.findFirst({
                where: {
                    code: propertyTypeCode
                }
            });

            if (propertyType) {
                this.propertyTypeCache[propertyTypeCode] = propertyType.id;
                return propertyType.id;
            }

            // Create new property type
            const newPropertyType = await this.db.propertyType.create({
                data: {
                    code: propertyTypeCode,
                    name: propertyTypeCode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: `Property type: ${propertyTypeCode}`,
                    isActive: true
                }
            });

            this.propertyTypeCache[propertyTypeCode] = newPropertyType.id;
            console.log(`✅ Created property type: ${propertyTypeCode}`);
            return newPropertyType.id;

        } catch (error) {
            this.errors.push(`Property type creation failed for ${propertyTypeCode}: ${error.message}`);
            console.error(`❌ Property type creation failed for ${propertyTypeCode}:`, error.message);
            return null;
        }
    }

    async importProperty(propertyData) {
        try {
            // Get property type ID
            const propertyTypeId = await this.getOrCreatePropertyType(
                propertyData.propertyTypeCode
            );

            if (!propertyTypeId) {
                return false;
            }

            // Check if property already exists (by code)
            const existingProperty = await this.db.property.findFirst({
                where: {
                    code: propertyData.code
                }
            });

            if (existingProperty) {
                console.log(`⚠️ Property already exists: ${propertyData.code}`);
                return true; // Skip duplicate
            }

            // Prepare property data for insertion
            const dbPropertyData = {
                id: propertyData.id,
                title: propertyData.title,
                description: propertyData.description,
                address: propertyData.address,
                city: propertyData.city,
                state: propertyData.state,
                zipCode: propertyData.zipCode,
                country: propertyData.country,
                price: parseFloat(propertyData.price),
                currencyCode: propertyData.currencyCode,
                bedrooms: parseInt(propertyData.bedrooms),
                bathrooms: parseInt(propertyData.bathrooms),
                areaSqm: propertyData.areaSqm,
                furnished: propertyData.furnished,
                images: propertyData.images,
                latitude: propertyData.latitude,
                longitude: propertyData.longitude,
                status: 'PENDING_REVIEW', // Always start as pending review
                code: propertyData.code,
                ownerId: this.systemUserId,
                propertyTypeId: propertyTypeId
            };

            // Create property
            const propertyRecord = await this.db.property.create({
                data: dbPropertyData
            });

            // Create listing approval record
            await this.db.listingApproval.create({
                data: {
                    propertyId: propertyRecord.id,
                    status: 'PENDING',
                    notes: `Imported from FazWaz on ${propertyData.fetchedAt || 'Unknown date'}`
                }
            });

            this.importedCount++;
            console.log(`✅ Imported property: ${propertyData.title.substring(0, 50)}...`);
            return true;

        } catch (error) {
            this.errorCount++;
            const errorMsg = `Property import failed for ${propertyData.title || 'Unknown'}: ${error.message}`;
            this.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
            return false;
        }
    }

    async importFromJson(jsonFile) {
        try {
            // Load transformed data
            const jsonData = fs.readFileSync(jsonFile, 'utf8');
            const propertiesData = JSON.parse(jsonData);

            console.log(`📥 Loaded ${propertiesData.length} properties from ${jsonFile}`);

            // Get or create system user
            if (!await this.getOrCreateSystemUser()) {
                console.log('❌ Failed to setup system user');
                return false;
            }

            // Import properties
            let successCount = 0;
            for (let i = 0; i < propertiesData.length; i++) {
                const propertyData = propertiesData[i];
                console.log(`📦 Importing property ${i + 1}/${propertiesData.length}`);

                if (await this.importProperty(propertyData)) {
                    successCount++;
                }

                // Progress update every 10 properties
                if ((i + 1) % 10 === 0) {
                    console.log(`📊 Progress: ${i + 1}/${propertiesData.length} (${successCount} successful)`);
                }
            }

            this.printImportSummary();
            return successCount > 0;

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`❌ File not found: ${jsonFile}`);
            } else if (error instanceof SyntaxError) {
                console.error(`❌ Invalid JSON in ${jsonFile}: ${error.message}`);
            } else {
                console.error(`❌ Import failed: ${error.message}`);
            }
            return false;
        }
    }

    printImportSummary() {
        console.log(`\n📊 Import Summary:`);
        console.log(`✅ Successfully imported: ${this.importedCount} properties`);
        console.log(`❌ Failed imports: ${this.errorCount} properties`);

        if (this.errors.length > 0) {
            console.log(`\n⚠️ Errors:`);
            this.errors.slice(0, 5).forEach(error => {
                console.log(`  • ${error}`);
            });
            if (this.errors.length > 5) {
                console.log(`  ... and ${this.errors.length - 5} more errors`);
            }
        }
    }
}

async function main() {
    console.log('🏠 RentVerse Database Import Tool');
    console.log('='.repeat(50));

    // Get JSON file path from command line arguments
    const jsonFile = process.argv[2] || path.join(__dirname, '../../rentverse_transformed_data_fixed.json');

    if (!fs.existsSync(jsonFile)) {
        console.error(`❌ File not found: ${jsonFile}`);
        console.log('Usage: node scripts/import-fazwaz-data.js [json-file-path]');
        return;
    }

    const importer = new RentVerseDataImporter();

    // Connect to database
    if (!await importer.connectDatabase()) {
        return;
    }

    try {
        // Import data from transformed JSON file
        if (await importer.importFromJson(jsonFile)) {
            console.log(`\n🎉 Database import completed successfully!`);
            console.log(`📁 Source: ${jsonFile}`);
            console.log(`📊 Imported: ${importer.importedCount} properties`);
        } else {
            console.log('❌ Database import failed');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    } finally {
        // Disconnect from database
        await importer.disconnectDatabase();
    }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
    console.log('\n⏹️ Import interrupted by user');
    process.exit(0);
});

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = RentVerseDataImporter;