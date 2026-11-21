const { EntitySchema } = require('typeorm')

const Skill = new EntitySchema({
  name: 'Skill',
  tableName: 'skills',
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

module.exports = { Skill }
