const { EntitySchema } = require('typeorm')

const CreditPackage = new EntitySchema({
  name: 'CreditPackage',
  tableName: 'credit_packages',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid'
    },
    name: {
      type: 'varchar',
      length: 100,
      unique: true,
      nullable: false
    },
    credit_amount: {
      type: 'integer',
      nullable: false
    },
    price: {
      type: 'decimal',
      precision: 12,
      scale: 2,
      nullable: false
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true
    }
  }
})

module.exports = { CreditPackage }
