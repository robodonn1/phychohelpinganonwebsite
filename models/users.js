const { DataTypes } = require("sequelize");
const sequelize = require(".");

const UserProfile = sequelize.define(
    'UserProfile',
    {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        nickname: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM('user', 'doctor', 'admin'), defaultValue: 'user' },
        showConfidential: { type: DataTypes.BOOLEAN, defaultValue: false },
        showPosts: { type: DataTypes.BOOLEAN, defaultValue: false },
        avatarUrl: { type: DataTypes.STRING, defaultValue: 'serverFiles/users/guest/ava.png' },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
    }, { tableName: 'UserProfile', }
);

const UsersConfidential = sequelize.define(
    'UserConfidential',
    {
        userId: { type: DataTypes.UUID, primaryKey: true, references: { model: UserProfile, key: 'id' } },
        fullName: { type: DataTypes.STRING },
        birthdate: { type: DataTypes.DATEONLY },
        profileDescription: { type: DataTypes.TEXT },
    }, { tableName: 'UserConfidential', }
);

const Specialization = sequelize.define(
    'Specialization',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING },
    }, { tableName: 'Specialization', }
);

const DoctorsConfidential = sequelize.define(
    'DoctorConfidential',
    {
        userId: { type: DataTypes.UUID, primaryKey: true, references: { model: UserProfile, key: 'id' } },
        specializationId: { type: DataTypes.INTEGER, references: { model: Specialization, key: 'id' } },
        workEmail: { type: DataTypes.STRING },
        experience: { type: DataTypes.INTEGER },
        workPhone: { type: DataTypes.STRING },
        officeAddress: { type: DataTypes.STRING },
    }, { tableName: 'DoctorConfidential', }
);

const Issuer = sequelize.define(
    'Issuer',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING },
        ogrn: { type: DataTypes.STRING, allowNull: false },
        inn: { type: DataTypes.STRING, allowNull: false },
    }, { tableName: 'Issuer', }
);

const License = sequelize.define(
    'License',
    {
        doctorId: { type: DataTypes.UUID, primaryKey: true, references: { model: DoctorsConfidential, key: 'userId' } },
        issuedId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Issuer, key: 'id' } },
        series: { type: DataTypes.STRING, allowNull: false },
        registerNumber: { type: DataTypes.STRING, allowNull: false },
        registerDate: { type: DataTypes.DATEONLY, allowNull: false },
        expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
        verificationStatus: { type: DataTypes.ENUM('pending', 'verified', 'rejected'), defaultValue: 'pending' },
        verifiedAt: { type: DataTypes.DATE },
    }, { tableName: 'License', }
);

const Guest = sequelize.define(
    'Guest',
    {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        sessionToken: { type: DataTypes.STRING, allowNull: false, unique: true },
        lastActivity: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, { tableName: 'Guest', }
);

const Review = sequelize.define(
    'Review',
    {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        text: { type: DataTypes.TEXT },
        userId: { type: DataTypes.UUID, references: { model: UserProfile, key: 'id' } },
    }, { tableName: 'Review', }
)

UserProfile.hasOne(DoctorsConfidential, { foreignKey: "userId", as: 'doctorInfo' });
DoctorsConfidential.belongsTo(UserProfile, { foreignKey: "userId", as: 'userInfo' });

UserProfile.hasOne(UsersConfidential, { foreignKey: "userId", as: 'confidential' });
UsersConfidential.belongsTo(UserProfile, { foreignKey: "userId", as: 'userInfo' });

DoctorsConfidential.hasOne(License, { foreignKey: "doctorId", as: 'license' });
License.belongsTo(DoctorsConfidential, { foreignKey: "doctorId", as: 'doctorInfo' });

Issuer.hasMany(License, { foreignKey: "issuedId", as: 'license' });
License.belongsTo(Issuer, { foreignKey: "issuedId", as: 'issuer' });

Specialization.hasMany(DoctorsConfidential, { foreignKey: "specializationId", as: 'doctorInfo' });
DoctorsConfidential.belongsTo(Specialization, { foreignKey: "specializationId", as: 'specialization' });

UserProfile.hasMany(Review, { foreignKey: 'userId', as: "reviews" });
Review.belongsTo(UserProfile, { foreignKey: 'userId', as: 'author' });

module.exports = { UserProfile, DoctorsConfidential, License, Guest, UsersConfidential, Specialization, Issuer, Review };