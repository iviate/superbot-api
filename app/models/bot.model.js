
module.exports = (sequelize, Sequelize, DataTypes) => {
    const Bot = sequelize.define("bot", {
      token: {
          type: DataTypes.STRING
      },
      token_at: {
           type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.INTEGER // 1 open, 2 pasuse, 3 closed
      },
      bot_type: {
        type: DataTypes.INTEGER // 1 iBotX, 2 3 cut, 3 4 cut
      },
      money_system: {
        type: DataTypes.INTEGER // 1 stable, 2 มาติงเกล, 3 ลาบูแชร์ 4 x system
      },
      profit_threshold: {
        type: DataTypes.FLOAT.UNSIGNED,
      },
      loss_threshold:{
        type: DataTypes.FLOAT.UNSIGNED,
      },
      profit_percent: {
        type: DataTypes.FLOAT.UNSIGNED,
      },
      loss_percent:{
        type: DataTypes.FLOAT.UNSIGNED,
      },
      init_wallet: {
        type: DataTypes.FLOAT.UNSIGNED,
      },
      init_bet: {
        type: DataTypes.FLOAT.UNSIGNED,
      },
      bet_side: {
        type: DataTypes.INTEGER, // 1 P/B , 2 ONLY P, 3 ONLY B, 11 R/B, 12 E/D, 13 S/B, 14 TWOZONE, 15 ONEZONE
      },
      max_turn: {
        type: DataTypes.INTEGER.UNSIGNED,
      },
      stats: {
        type: DataTypes.TEXT,
        defaultValue: '[]'
      },
      data: {
        type: DataTypes.TEXT,
        defaultValue: '[]'
      },
      stop_by: {
        type: DataTypes.INTEGER, // 1 user, 2 profit stop, 3 loss stop, 4 error
        allowNull: true
      },
      stop_wallet: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      is_infinite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      profit_wallet: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      deposite_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_opposite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      turnover: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      zero_bet: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      open_zero: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    });

    Bot.associate = function(models) {
        Order.belongsTo(models.Area, {foreignKey: 'areaId', as: 'area'});
        Bot.belongsTo(User, {foreignKey: 'user_id', as: 'user'})
      };
    
  
    return Bot;
  };