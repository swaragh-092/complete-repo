#sql cli installation
npm install --save-dev sequelize-cli




#seeding command 

npx sequelize-cli db:seed:all


#migration command
npx sequelize-cli migration:generate --name create-attendances-table


