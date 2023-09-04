const { queryDb } = require('./query-db');
const bcrypt = require('bcrypt');

module.exports = class PgPersistence {
  async authenticate(username, password) {
    const FIND_PASSWORD = 'SELECT password FROM users WHERE username = $1';

    let result = await queryDb(FIND_PASSWORD, username);

    let passwordExists = result.rowCount === 1;

    if (!passwordExists) {
      return false;
    }    

    let storedHashedPassword = result.rows[0].password;
    return bcrypt.compare(password, storedHashedPassword);
  }

  _calcOffset(recordsPerPage, pageNum) {
    let offset = recordsPerPage * (pageNum - 1);
    return offset;
  }

  //Calculates the total number of records for 2 pages
  _calcLimit(recordsPerPage) {
    const numRecords2pages = recordsPerPage * 2;
    return numRecords2pages;
  }

  //We query the database for all the scientist records for 2 pages.
  //Depending on the number of records for 2 pages, it will
  //determine if we will render the 'Next 10 Scientists' link.
  async getScientists(pageNum) {
    const recordsPerPage = 10;
    
    let offset = this._calcOffset(recordsPerPage, pageNum);
    let limit = this._calcLimit(recordsPerPage);

    const GET_SCIENTISTS = 'SELECT * FROM scientists ORDER BY fullname ASC LIMIT $1 OFFSET $2';

    try {
      let result = await queryDb(GET_SCIENTISTS, limit, offset);
      console.log('result from db rows property is: ', result);
      //Note - if there are no scientists/records, result.rows is an empty array, which is truthy
      let scientists = result.rows;
      return scientists;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return false;
      }
      throw error;
    }
  }

  //getFacts method gets facts for 2 pages. This is for pagination purposes, to
  //see if we render the link to go to the next page of facts.
  async getFacts(scientistId, factPageNum)  {
    const recordsPerPage = 3

    let offset = this._calcOffset(recordsPerPage, factPageNum);
    let limit = this._calcLimit(recordsPerPage);

    const GET_FACTS = 'SELECT * FROM facts WHERE scientist_id = $1 ORDER BY fact ASC LIMIT $2 OFFSET $3';

    try {
      let result = await queryDb(GET_FACTS, scientistId, limit, offset);
      let facts = result.rows;
      return facts;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return false;
      }
      throw error;
    }
  }

  _isInvalidInputSyntax(error) {
    return /invalid input syntax/.test(String(error));
  }

  async getSciDetails(scientistId) {
    const GET_SCIENTIST = 'SELECT * FROM scientists WHERE id = $1';

    try {
      let result = await queryDb(GET_SCIENTIST, scientistId);
      let sciDetails = result.rows[0];
      return sciDetails;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return false;
      }
      throw error;
    }

  }

  async getFact(scientistId, factId) {
    const GET_FACT = 'SELECT * FROM facts WHERE scientist_id = $1 AND id = $2';

    try {
      let result = await queryDb(GET_FACT, scientistId, factId);
      let factObj = result.rows[0];
      return factObj;
    } catch (error) {
      if (this._isInvalidInputSyntax(error)) {
        return false;
      }
      throw error;
    } 
  }

  async scientistNameExists(submittedName, currentName = null) {
    const GET_SCIENTIST_NAME = 'SELECT * FROM scientists WHERE fullname = $1';

    let result = await queryDb(GET_SCIENTIST_NAME, submittedName);

    //If the submitted name is the same as the current name, then
    //we return a resolved promise, otherwise, we return
    //a rejected promise indicating that the submitted name is invalid
    if (result.rowCount > 0 && submittedName !== currentName ) {
      return Promise.reject('Scientist name already exists');
    } else {
      return Promise.resolve('Scientist name is unique');
    }
  }

  _isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  async addNewScientist(fullname, birthdate, birthplace) {
    const ADD_SCIENTIST = 'INSERT INTO scientists(fullname, birthdate, birthplace) VALUES ($1, $2, $3)';

    try {
      let result = await queryDb(ADD_SCIENTIST, fullname, birthdate, birthplace);
      return result.rowCount > 0;
    } catch (error) {
      if (this._isUniqueConstraintViolation(error)) {
        return 'scientist not unique';
      }
      throw error;
    }
  }

  async editScientist(scientistId, fullname, birthdate, birthplace) {
    const EDIT_SCIENTIST = 'UPDATE scientists SET fullname = $1, birthdate = $2, birthplace = $3 WHERE id = $4';

    try {
      let result = await queryDb(EDIT_SCIENTIST, fullname, birthdate, birthplace, scientistId);
      return result.rowCount > 0;
    } catch (error) {
      if (this._isUniqueConstraintViolation(error)) {
        return 'scientist not unique';
      }
      throw error;
    }
  }

  async deleteScientist(scientistId) {
    const DELETE_SCIENTIST = 'DELETE FROM scientists WHERE id = $1';

    let result = await queryDb(DELETE_SCIENTIST, scientistId);
  
    return result.rowCount > 0;
  }

  async addFact(scientistId, newFactText) {
    const ADD_FACT = 'INSERT INTO facts(scientist_id, fact) VALUES ($1, $2)';

    try {
      let result = await queryDb(ADD_FACT, scientistId, newFactText);
      return result.rowCount > 0;
    } catch (error) {
      if (this._isUniqueConstraintViolation(error)) {
        return 'fact not unique';
      }
      throw error;
    }
  }

  async editFact(sciId, factId, factText) {
    const EDIT_FACT = 'UPDATE facts SET fact = $1 WHERE scientist_id = $2 AND id = $3';

    try {
      let result = await queryDb(EDIT_FACT, factText, sciId, factId);
      return result.rowCount > 0;
    } catch (error) {
      if (this._isUniqueConstraintViolation(error)) {
        return 'fact not unique';
      } 
      throw error;
    }
  }

  async deleteFact(scientistId, factId) {
    const DELETE_FACT = 'DELETE FROM facts WHERE scientist_id = $1 AND id = $2';

    let result = await queryDb(DELETE_FACT, scientistId, factId);
  
    return result.rowCount > 0;
  }
}