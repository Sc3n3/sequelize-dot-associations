# sequelize-dot-associations

Dot notation support for Sequelize associations like Laravel Eloquent

Visit the [Sequelize](https://www.sequelize.org/) for examples.

## Install

```bash
npm install sequelize sequelize-dot-associations --save
```

## Quick Start

```js
// Auto register
const sequelize = require('sequelize-dot-associations')(require('sequelize'));
```

## Usage

```js
const { Sequelize, DataTypes, Model } = require('sequelize-dot-associations')(require('sequelize'));

class Book extends Model {}
class Category extends Model {}
class Store extends Model {}

const database = new Sequelize({
  logging: false,
  dialect: 'sqlite',
  storage: __dirname +'/bookstore.sqlite'
});

Book.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING
  },
  categoryId: {
    type: DataTypes.INTEGER
  },
  storeId: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize: database,
  tableName: 'books',
  timestamps: false
});

Store.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING
  }
}, {
  sequelize: database,
  tableName: 'stores',
  timestamps: false
});

Category.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING
  },
  parentId: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize: database,
  tableName: 'categories',
  timestamps: false
});

// "as" property is important! 

Book.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });
Book.belongsTo(Store, { as: 'store', foreignKey: 'storeId' });

Category.hasMany(Book, { as: 'books', foreignKey: 'categoryId' });
Category.hasMany(Category, { as: 'subs', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });

Store.hasMany(Book, { as: 'books', foreignKey: 'storeId' });

(async () => {

  const queries = [
    () => Category.findAll({ include: '!books' }), // Category must have any book
    () => Category.findAll({ include: '?books' }), // Category could not have any book
    () => Category.findAll({ include: 'subs:5' }), // Recursive association
    () => Category.findAll({ include: 'subs.books.store' }), // Nested associations
    () => Category.findAll({ include: 'subs:5.books' }), // Recursive nested association
    () => Category.findAll({ include: [ 'books.store', 'parent' ] }), // Multiple associations
    () => Category.findAll({ include: ['!books', '?parent'] }), // Category must have any book, but dont need parent category
    () => Category.findAll({ include: { 'parent.books': true, 'subs:5.books': { where: { id: 6 }, limit: 1 } } }), // keys are associations
    () => Category.findAll({ include: { 'parent.books': true, 'subs:5.books': () => ({ where: { id: 6 }, limit: 1 }) } }), // association value can be function
  ];

  for (const result of queries) {
    console.log('-------------------');
    console.log(JSON.stringify(await result(), null, 2));  
  }

}).call(null);
```
