const { EntitySchema } = require('typeorm')

const CoachLinkSkill = new EntitySchema({
  name: 'CoachLinkSkill',
  tableName: 'coach_link_skills',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid'
    },
    coach_id: {
      type: 'uuid',
      nullable: false
    },
    skill_id: {
      type: 'uuid',
      nullable: false
    }
  }
})

module.exports = { CoachLinkSkill }
