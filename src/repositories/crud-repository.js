// repository talks to models
// controllers dont directly talk with models
// services have business logic 
const {StatusCodes} = require('http-status-codes');
const {Logger} = require('../config');
const AppError = require('../utils/errors/app-error');

class CrudRepository{
    constructor(model){
        this.model = model;
    }
    async create(data){
        const response = await this.model.create(data);
        return response;
    }
    //this create function will help to create some data
    async destroy(data){
        const response = await this.model.destroy({
                where: {
                    id:data
                }
        });
        if(!response){
            throw new AppError('Not able to find the resource to delete',StatusCodes.NOT_FOUND);
        }
        return response;

    }
    //this create function will help to delete some data
    async get(data){
        const response = await this.model.findByPk(data);
        if(!response){
            throw new AppError('Not able to find the resource',StatusCodes.NOT_FOUND);
        }
            return response;
    }
    async getAll(){
        const response = await this.model.findAll();

        return response;
    }
    async update(id,data){  //here data is object
        const response = await this.model.update(data,{
                where: {
                    id: id 
                }
            });
        if(response[0] === 0){
            throw new AppError('Not able to find the resource',StatusCodes.NOT_FOUND);
        }
        return response;
    }
}
module.exports=CrudRepository;