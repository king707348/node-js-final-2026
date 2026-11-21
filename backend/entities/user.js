const { EntitySchema } = require('typeorm')

const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid'
    },
    name: {
      type: 'varchar',
      length: 100,
      nullable: false
    },
    email: {
      type: 'varchar',
      length: 100,
      unique: true,
      nullable: false
    },
    password: {
      type: 'varchar',
      length: 255,
      nullable: false
    },
    role: {
      type: 'varchar',
      length: 20,
      nullable: false,
      default: 'USER'
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

module.exports = { User }
