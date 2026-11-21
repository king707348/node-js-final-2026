require('dotenv').config()

const { DataSource } = require("typeorm")

const { Coach } = require("../entities/coach")
const { User } = require("../entities/user")
const { Skill } = require("../entities/skill")
const { CreditPackage } = require("../entities/creditPackage")
const { CoachLinkSkill } = require("../entities/coachLinkSkill")
const { Course } = require("../entities/course")
const { CreditPackagePurchase } = require("../entities/creditPackagePurchase")
const { CourseBooking } = require("../entities/courseBooking")

const dataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  ssl: process.env.DB_ENABLE_SSL === 'true',
  entities: [
    User,
    Coach,
    Skill,
    CreditPackage,
    CoachLinkSkill,
    Course,
    CreditPackagePurchase,
    CourseBooking
  ],
  migrations: ["db/migrations/*.js"]
})

module.exports = { dataSource }