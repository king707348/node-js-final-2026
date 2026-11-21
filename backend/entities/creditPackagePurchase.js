const { EntitySchema } = require('typeorm')

const CreditPackagePurchase = new EntitySchema({
  name: 'CreditPackagePurchase',
  tableName: 'credit_package_purchases',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid'
    },
    user_id: {
      type: 'uuid',
      nullable: false
    },
    credit_package_id: {
      type: 'uuid',
      nullable: false
    },
    purchased_credits: {
      type: 'integer',
      nullable: false
    },
    price_paid: {
      type: 'decimal',
      precision: 12,
      scale: 2,
      nullable: false
    },
    purchase_at: {
      type: 'timestamp',
      createDate: true
    }
  }
})

module.exports = { CreditPackagePurchase }
