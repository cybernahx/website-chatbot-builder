const mongoose = require('mongoose');
const Datastore = require('nedb-promises');
const path = require('path');

let useNeDB = false;
let nedbStores = {};

// Initialize NeDB stores
function initNeDB() {
    const dbPath = path.join(__dirname, '../data');
    
    nedbStores = {
        users: Datastore.create({ 
            filename: path.join(dbPath, 'users.db'), 
            autoload: true 
        }),
        chatbots: Datastore.create({ 
            filename: path.join(dbPath, 'chatbots.db'), 
            autoload: true 
        }),
        leads: Datastore.create({ 
            filename: path.join(dbPath, 'leads.db'), 
            autoload: true 
        }),
        conversations: Datastore.create({ 
            filename: path.join(dbPath, 'conversations.db'), 
            autoload: true 
        })
    };

    // Create indexes
    nedbStores.users.ensureIndex({ fieldName: 'email', unique: true });
    nedbStores.chatbots.ensureIndex({ fieldName: 'botId', unique: true });
    nedbStores.chatbots.ensureIndex({ fieldName: 'userId' });
    
    console.log('📦 Using NeDB (file-based database) as fallback');
    console.log(`📁 Data location: ${dbPath}`);
    
    return true;
}

// Try to connect to MongoDB, fallback to NeDB
async function connectDatabase(mongoUri) {
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ MongoDB connected successfully');
        console.log(`🗄️  Database: ${mongoose.connection.name}`);
        useNeDB = false;
        return { success: true, type: 'mongodb' };
        
    } catch (error) {
        console.log('⚠️  MongoDB not available:', error.message);
        console.log('🔄 Switching to NeDB fallback...');
        
        initNeDB();
        useNeDB = true;
        return { success: true, type: 'nedb' };
    }
}

// Database adapter functions
const dbAdapter = {
    isUsingNeDB: () => useNeDB,
    
    getStore: (storeName) => {
        if (useNeDB) {
            return nedbStores[storeName];
        }
        return null;
    },

    // Generic find operation
    find: async (model, query = {}, options = {}) => {
        if (useNeDB) {
            const storeName = model.collection.name;
            const store = nedbStores[storeName];
            if (!store) return [];
            
            let cursor = store.find(query);
            if (options.sort) cursor = cursor.sort(options.sort);
            if (options.limit) cursor = cursor.limit(options.limit);
            if (options.skip) cursor = cursor.skip(options.skip);
            
            return await cursor.exec();
        }
        return await model.find(query, null, options);
    },

    // Generic findOne operation
    findOne: async (model, query = {}) => {
        if (useNeDB) {
            const storeName = model.collection.name;
            const store = nedbStores[storeName];
            if (!store) return null;
            return await store.findOne(query);
        }
        return await model.findOne(query);
    },

    // Generic create operation
    create: async (model, data) => {
        if (useNeDB) {
            const storeName = model.collection.name;
            const store = nedbStores[storeName];
            if (!store) throw new Error('Store not found');
            
            // Add timestamps
            const doc = {
                ...data,
                createdAt: data.createdAt || new Date(),
                updatedAt: data.updatedAt || new Date()
            };
            
            return await store.insert(doc);
        }
        return await model.create(data);
    },

    // Generic update operation
    update: async (model, query, update, options = {}) => {
        if (useNeDB) {
            const storeName = model.collection.name;
            const store = nedbStores[storeName];
            if (!store) return null;
            
            update.updatedAt = new Date();
            
            if (options.new || options.returnDocument === 'after') {
                await store.update(query, { $set: update }, { returnUpdatedDocs: true });
                return await store.findOne(query);
            }
            
            await store.update(query, { $set: update }, { multi: options.multi || false });
            return await store.findOne(query);
        }
        
        if (options.new) {
            return await model.findOneAndUpdate(query, update, { new: true });
        }
        return await model.updateOne(query, update, options);
    },

    // Generic delete operation
    delete: async (model, query) => {
        if (useNeDB) {
            const storeName = model.collection.name;
            const store = nedbStores[storeName];
            if (!store) return { deletedCount: 0 };
            
            const numRemoved = await store.remove(query, { multi: true });
            return { deletedCount: numRemoved };
        }
        return await model.deleteMany(query);
    },

    // Count documents
    count: async (model, query = {}) => {
        if (useNeDB) {
            const storeName = model.collection.name;
            const store = nedbStores[storeName];
            if (!store) return 0;
            return await store.count(query);
        }
        return await model.countDocuments(query);
    }
};

module.exports = {
    connectDatabase,
    dbAdapter
};
