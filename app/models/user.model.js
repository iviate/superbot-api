
module.exports = (sequelize, Sequelize, DataTypes) => {
    const User = sequelize.define("user", {
      username: {
        type: DataTypes.STRING
      },
      password: {
        type: DataTypes.STRING
      },
      type_password: {
        type: DataTypes.STRING
      },
      last_login: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      is_remember:{
        type: DataTypes.BOOLEAN,
        defdefaultValueault: false
      },
      agent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      line: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profit_wallet: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      is_mock: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      mock_wallet: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      ufa_account: {
        type: DataTypes.STRING
      },
      cookie : {
        type: DataTypes.TEXT
      },
      cookieTime : {
        type: DataTypes.STRING
      },
      web: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
      },
      imbaCookie: {
        type: DataTypes.STRING,
      }
      
    });
  
    return User;
  };