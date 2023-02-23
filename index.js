module.exports = (sequelize) => {

  Object.isObject = (o) => typeof o === 'object';
  Function.isFunction = (f) => typeof f === 'function' && typeof f.prototype === 'undefined';

  class Model extends sequelize.Model
  {
    static _parseAssociations(association, extra = {}){
      if (typeof association === 'string') {
        const detail = /([!\?]*)?([^:\.]+):?([0-9]*)\.?(.+)?/g.exec(association);

        const assoc = {
          requrired: detail[1],
          name: detail[2],
          depth: (detail[3] - 1) || 0,
          remain: detail[4]
        };

        if (this.associations[assoc.name]) {
          const _model = this.associations[assoc.name].target;
          const includes = (() => {

            if (extra.include && !assoc.remain) {
              extra.include = _model._parseAssociations(extra.include);
            }

            if (!assoc.depth) {
              return _model._parseAssociations(assoc.remain, extra);
            }

            const subAssociations = [];
            assoc.remain && subAssociations.push(assoc.remain);

            if (assoc.depth > 0) {
              const subSubs = [ assoc.name+':'+ (assoc.depth - 1) ];
              assoc.remain && subSubs.push(assoc.remain);
              subAssociations.push(subSubs.join('.'));
            }

            return _model._parseAssociations(subAssociations, extra);
          }).call(null);

          assoc.remain && ( extra = {} );

          return {
            as: assoc.name,
            model: _model,
            ...(assoc.requrired ? { required: (assoc.requrired === '!') } : {}),
            ...(includes ? { include: includes } : {}),
            ...extra
          };
        }

      } else if (Array.isArray(association)) {

        association = association.map(assoc => this._parseAssociations(assoc, extra));

      } else if (Object.isObject(association)) {

        const associations = [];

        for (const key of Object.keys(association)) {
          if (Function.isFunction(association[key])) {
            associations.push(this._parseAssociations(key, association[key].call(null)));
          } else if (association[key] === true) {
            associations.push(this._parseAssociations(key));
          } else if (Object.isObject(association[key])) {
            associations.push(this._parseAssociations(key, association[key]));
          }
        }

        association = associations;
      }

      return association;
    }
    
    static _updateOptions(options){
      if (options.include) {
       options.include = this._parseAssociations(options.include);
      }
      
      return options;
    }

    static findOne(options){
      return super.findOne(this._updateOptions(options));
    }

    static findAll(options){
      return super.findAll(this._updateOptions(options));
    }

    static findAndCountAll(options){
      return super.findAndCountAll(this._updateOptions(options)); 
    }

    static count(options){
      return super.count(this._updateOptions(options)); 
    }
  }

  class Sequelize extends sequelize.Sequelize
  {
    define(modelName, attributes = {}, options = {}) {
      options.modelName = modelName;
      options.sequelize = this;

      const model = class extends Model {};

      model.init(attributes, options);

      return model;
    }
  }

  Sequelize.Model = Model;
  Sequelize.Sequelize = Sequelize;
  
  return Sequelize;
};