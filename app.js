const config = require('./lib/config');
const express = require('express');
const morgan = require('morgan');
const flash = require('express-flash');
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const store = require('connect-loki');
const PgPersistence = require('./lib/pg-persistence');
const catchError = require('./lib/catch-error');

const app = express();
const host = config.HOST;
const port = config.PORT;
console.log(')))))___________________)))))))))))))))))port is declared again and is: ', port);
const LokiStore = store(session);

app.set('views', './views');
app.set('view engine', 'pug');

app.use(morgan('common'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log('req.session before session mw is: ', req.session);
  next();
});

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in millseconds
    path: '/',
    secure: false,
  },
  name: 'scientists-app-session-id',
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}),
}));

app.use((req, res, next) => {
  console.log('req.session after session mw is: ', req.session);
  console.log('req.session.flash before flash mw is: ', req.session.flash);
  next();
});

app.use(flash());

app.use((req, res, next) => {
  // console.log('req.session after session mw is: ', req.session);
  console.log('req.session.flash after flash mw is: ', req.session.flash);
  next();
});


app.use((req, res, next) => {
  // res.locals.store = new PgPersistence(req.session); //original
  res.locals.store = new PgPersistence(); //modified - i dont think we need to pass req.session into pg persistence
  next();
});

app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flashObj = req.session.flash;
  delete req.session.flash;
  next();
});

// Middleware - checks if user is signed in
const isAuthenticated = (req, res, next) => {
  if (!res.locals.signedIn) {
    res.redirect(302, `/users/signin?redirect=${req.url}`);
  } else {
    next();
  }
};

// Middleware - validates Scientist page query string parameter
const validateQueryStrSciPage = catchError(async (req, res, next) => {
// const validateQueryStrSciPage = async (req, res, next) => {
  // try {


    const recordsPerPage = 10;
    let store = res.locals.store;

    let requestedPageNum = req.query.page === undefined ? 1 : Number(req.query.page);
    
    //Get scientist records for 2 pages, in order to know if
    //we should display the pagination link to go to the next page of scientists.
    let scientists = await store.getScientists(requestedPageNum); 
    
    let noScientists = scientists.length === 0;
    let pageNumIsNotOne = requestedPageNum !== 1;

    // if (!requestedPageNum || (noScientists && pageNumIsNotOne)) {
    //   req.flash('error', 'Scientists list page not found.');
    //   res.redirect('/scientists?page=1');
    // } else {
    //   let renderNextPageLink = scientists.length > recordsPerPage;

    //   res.locals.pageNum = requestedPageNum;
    //   res.locals.scientists = scientists.slice(0, recordsPerPage); 
    //   res.locals.renderNextPageLink = renderNextPageLink;
      
    //   next();
    // }
    
    if (!requestedPageNum || (noScientists && pageNumIsNotOne)) {
      // req.flash('error', 'Scientists list page not found.');
      // res.redirect('/scientists?page=1');
      next(new Error('resource not found'));
      // throw new Error('resource not found yo');
    }
    
    let renderNextPageLink = scientists.length > recordsPerPage;

    res.locals.pageNum = requestedPageNum;
    res.locals.scientists = scientists.slice(0, recordsPerPage); 
    res.locals.renderNextPageLink = renderNextPageLink;
    
    console.log('does the rest of this code run???????????????');
    console.log('res.locals.renderNextPageLink is: ', res.locals.renderNextFactPageLink);
    console.log('res.locals.scientists is: ', res.locals.scientists);

    next();
});


// Middleware - validates fact page query string parameter
const validateQueryStrFactPage = catchError(async (req, res, next) => {
  const recordsPerPage = 3;
  let store = res.locals.store;
  let sciId = req.params.scientistId;

  let requestedFactPage = req.query.factpg === undefined ? 1 : Number(req.query.factpg);
  
  //Gets facts for 2 pages, in order to know if we should
  //display the pagination link to go to the next page of facts.
  let factsList = await store.getFacts(+sciId, requestedFactPage); 

  let noFacts = factsList.length === 0;
  let factPageIsNotOne = requestedFactPage !== 1;

  if (!requestedFactPage || (noFacts && factPageIsNotOne)) {
    req.flash('error', 'Fact page not found.');
    res.redirect('/scientists?page=1');
  } else {
    let renderNextFactPageLink = factsList.length > recordsPerPage;

    res.locals.factPageNum = requestedFactPage;
    res.locals.factsList = factsList.slice(0, recordsPerPage);
    res.locals.renderNextFactPageLink = renderNextFactPageLink;
    
    next();
  }  
});

// Middleware - validate scientistId URL parameter
const validateSciIdParam = catchError(async (req, res, next) => {
  let store = res.locals.store;
  let sciId = req.params.scientistId;
  let sciDetails = await store.getSciDetails(+sciId);
  if (!sciDetails) {
    req.flash('error', 'Scientist not found.');
    res.redirect('/scientists?page=1');
  } else {
    res.locals.sciDetails = sciDetails;
    next();
  }
});

// Middleware - validate factId URL parameter
const validateFactIdParam = catchError(async (req, res, next) => {
  let store = res.locals.store;
  let sciId = req.params.scientistId;
  let factId = req.params.factId;

  let factObj = await store.getFact(+sciId, +factId);

  if (!factObj) {
    req.flash('error', 'Fact not found.');
    res.redirect('/scientists?page=1');
  } else {
    res.locals.factText = factObj.fact;
    next();
  }
});

app.get('/', (req, res) => {
  res.redirect('/scientists?page=1');
});

//Display all scientists 
app.get('/scientists', 
  // isAuthenticated,
  validateQueryStrSciPage,
  catchError(async (req, res) => {
    console.log('this route handler runs!!!!!!');
    const recordsPerPage = 10;
    let { scientists, pageNum, renderNextPageLink } = res.locals;
    scientists = scientists.slice(0, recordsPerPage);
    
    res.render('scientists', {scientists, pageNum, renderNextPageLink});
  })
);

//Display create new scientist page
app.get('/scientists/new',
  isAuthenticated,
  (req, res) => {
    res.render('new-scientist');
  }
);

//Route handler for creating a new scientist
const createNewSciRouteHandler = catchError(async (req, res) => {
  let store = res.locals.store;

  await Promise.all([
    body('fullname')
      .trim()
      .isLength({min: 1})
      .withMessage('Scientist name is required.')
      .isLength({max: 100})
      .withMessage('The name must be between 1 and 100 characters.')
      .custom(submittedName => store.scientistNameExists(submittedName))
      .withMessage('Scientist name must be unique.')
      .run(req),
    body('birthdate')
      .trim()
      .optional({checkFalsy: true})
      .isDate({format: 'YYYY-MM-DD'})
      .withMessage('Birthdate must be in the form YYYY-MM-DD or blank.')
      .run(req),
    body('birthplace')
      .trim()
      .isLength({max: 100})
      .withMessage('Birthplace must not exceed 100 characters.')
      .run(req)
  ]);

  const rerenderNewSciPage = (fullname, birthdate, birthplace) => {
    console.log('req.session looks like this before req.flash call: ', req.session);

    let flashObj = req.flash();
    console.log('req.session looks like this after req.flash call: ', req.session);

    res.render('new-scientist', {flashObj, fullname, birthdate, birthplace})
  }

  let { fullname, birthdate, birthplace } = req.body;
  let errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    let validInputs = {fullname, birthdate, birthplace}

    errors.array().forEach(error => {
      req.flash('error', error.msg);
      if (error.param === 'fullname') {
        validInputs.fullname = '';
      } else if (error.param === 'birthdate') {
        validInputs.birthdate = '';
      } else if (error.param === 'birthplace') {
        validInputs.birthplace = '';
      }
    });
  
    rerenderNewSciPage(validInputs.fullname, validInputs.birthdate, validInputs.birthplace);
  } else {
    let createSci = await store.addNewScientist(fullname, birthdate, birthplace);
    if (createSci === 'scientist not unique') {
      req.flash('error', 'Scientist name must be unique.');
      rerenderNewSciPage('', birthdate, birthplace);
    } else if (createSci === false) {
      req.flash('error', 'Scientist not added.');
      rerenderNewSciPage();
    } else {
      req.flash('success', 'The new scientist was added.');
      res.redirect('/scientists?page=1');
    }
  }
})

//Creates new scientist
app.post('/scientists/new', 
  isAuthenticated,
  createNewSciRouteHandler
);

//Display all facts for a scientist
app.get('/scientists/:scientistId', 
  isAuthenticated,
  validateSciIdParam, 
  validateQueryStrFactPage,
  catchError(async (req, res) => {
    let sciId = req.params.scientistId;
    let { factsList, factPageNum, renderNextFactPageLink } = res.locals;
    let { fullname, birthdate, birthplace } = res.locals.sciDetails;
  
    res.render('facts', 
      {
        factsList, 
        sciId, 
        fullname, 
        birthdate, 
        birthplace, 
        factPageNum, 
        renderNextFactPageLink
      }
    );
  })
);

//Display edit scientist details form
app.get('/scientists/:scientistId/edit',
  isAuthenticated,
  validateSciIdParam,
  catchError(async (req, res) => {
    let sciId = req.params.scientistId;
    let { fullname, birthdate, birthplace } = res.locals.sciDetails;
    let currentName = fullname;

    res.render('edit-scientist', { sciId, currentName, fullname, birthdate, birthplace });
  })
);

//Route handler for editing scientist 
const editScientistRouteHandler = catchError(async (req, res) => {
  let store = res.locals.store;
  let currentName = res.locals.sciDetails.fullname;
  let sciId = req.params.scientistId;
  let { fullname, birthdate, birthplace } = req.body; 

  await Promise.all([
    body('fullname')
      .trim()
      .isLength({min: 1})
      .withMessage('Scientist name is required.')
      .isLength({max: 100})
      .withMessage('The name must be between 1 and 100 characters.')
      .custom(submittedName => store.scientistNameExists(submittedName, currentName))
      .withMessage('Scientist name must be unique.')
      .run(req),
    body('birthdate')
      .trim()
      .optional({checkFalsy: true})
      .isDate({format: 'YYYY-MM-DD'})
      .withMessage('Birthdate must be in the form YYYY-MM-DD or blank.')
      .run(req),
    body('birthplace')
      .trim()
      .isLength({max: 100})
      .withMessage('Birthplace must not exceed 100 characters.')
      .run(req),
  ]);
  
  const rerenderEditSciDetails = async (fullname, birthdate, birthplace) => {
    let flashObj = req.flash();
    console.log('flashObj is: ', flashObj);
    console.log('req.flash() is: ', req.flash());

    res.render('edit-scientist', 
      {
        flashObj, 
        currentName, 
        sciId, 
        fullname, 
        birthdate, 
        birthplace 
      }
    );
  }

  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    let validInputs = {fullname, birthdate, birthplace};

    errors.array().forEach(error => {
      req.flash('error', error.msg)
      if (error.param === 'fullname') {
        validInputs.fullname = '';
      } else if (error.param === 'birthdate') {
        validInputs.birthdate = '';
      } else if (error.param === 'birthplace') {
        validInputs.birthplace = '';
      }
    });

    rerenderEditSciDetails(
      validInputs.fullname, 
      validInputs.birthdate, 
      validInputs.birthplace
    );

  } else {
    let updateScientist = await store.editScientist(+sciId, fullname, birthdate, birthplace);

    if (updateScientist === false) {
      throw new Error('Scientist not found');
    } else if (updateScientist === 'scientist not unique') {
      req.flash('error', 'Scientist name must be unique.');
      rerenderEditSciDetails('', birthdate, birthplace);        
    } else {
      req.flash('success', 'The scientist\'s details were edited.');
      res.redirect(`/scientists/${sciId}?factpg=1`);
    }
  }
})

//Route for editing scientist
app.post('/scientists/:scientistId/edit',
  isAuthenticated,
  validateSciIdParam,
  editScientistRouteHandler
);

//Create a new fact
app.post('/scientists/:scientistId/addFact',
  isAuthenticated,
  validateSciIdParam,
  [
    body('factText')
      .trim()
      .isLength({min: 1})
      .withMessage('The fact text is required.')
      .isLength({max: 500})
      .withMessage('The fact text must be between 1 and 500 characters.')
  ],
  catchError(async (req, res) => {
    let newFact = req.body.factText;
    let sciId = req.params.scientistId;
    let store = res.locals.store;
    
    let factPageNum = Number(req.query.factpg) || 1;

    let errors = validationResult(req);
    console.log('errors is: ', errors);
    const rerenderFactsPage = async () => {
      let { fullname, birthdate, birthplace } = res.locals.sciDetails;
      
      let flashObj = req.flash();

      let factsList = await store.getFacts(+sciId, factPageNum);  

      const recordsPerPage = 3;
      let renderNextPageLink = factsList.length > recordsPerPage;

      factsList = factsList.slice(0, recordsPerPage);
      
      res.render('facts', 
        {
          flashObj, 
          factsList, 
          sciId, 
          fullname, 
          birthdate, 
          birthplace, 
          factPageNum, 
          renderNextPageLink
        }
      );
    }

    if (!errors.isEmpty()) {
      errors.array().forEach(error => req.flash('error', error.msg));
      await rerenderFactsPage();
    } else {
      let addedNewFact = await store.addFact(+sciId, newFact);

      if (!addedNewFact) {
        throw new Error('Scientist not found')
      } else if (addedNewFact === 'fact not unique') {
        req.flash('error', 'Fact must be unique');
        await rerenderFactsPage(); 
      } else if (addedNewFact === true) {
        req.flash('success', 'The new fact was added.');
        res.redirect(`/scientists/${sciId}?factpg=1`);  
      } 
    }
  })
);

//Display edit fact form
app.get('/scientists/:scientistId/facts/:factId/edit',
  isAuthenticated,
  validateSciIdParam,
  validateFactIdParam,
  catchError(async (req, res) => {
    let sciId = req.params.scientistId;
    let factId = req.params.factId;
    let { sciDetails, factText } = res.locals;
    let fullname = sciDetails.fullname;
    
    res.render('edit-fact', { factText, factId, sciId, fullname });
  })
);

//Edit a fact
app.post('/scientists/:scientistId/facts/:factId/edit',
  isAuthenticated,
  validateSciIdParam,
  validateFactIdParam,
  [
    body('factText')
      .trim()
      .isLength({min: 1})
      .withMessage('The fact text is required.')
      .isLength({max: 500})
      .withMessage('The fact text must be between 1 and 500 characters.')
  ],
  catchError(async (req, res) => {
    let store = res.locals.store;
    let sciId = req.params.scientistId;
    let factId = req.params.factId;
    let newFactText = req.body.factText;
    let errors = validationResult(req);

    const rerenderEditFactsPage = async () => {
      let fullname = res.locals.sciDetails.fullname;
      let factText = '';
      let flashObj = req.flash();

      res.render('edit-fact', {flashObj, factText, sciId, fullname, factId })
    }

    if (!errors.isEmpty()) {
      errors.array().forEach(error => req.flash('error', error.msg));
      rerenderEditFactsPage();
    } else {
      let updateFact = await store.editFact(+sciId, +factId, newFactText)

      if (!updateFact) {
        throw new Error('Scientist or fact not found.');
      } else if (updateFact === 'fact not unique') {
        req.flash('error', 'Fact must be unique');
        rerenderEditFactsPage();
      } else if (updateFact === true) {
        req.flash('success', 'The fact was edited.');
        res.redirect(`/scientists/${sciId}?factpg=1`)
      }
    }
  })
);

//Delete a fact
app.post('/scientists/:scientistId/facts/:factId/destroy',
  isAuthenticated,
  validateSciIdParam,
  validateFactIdParam,
  catchError(async (req, res) => {
    let sciId = req.params.scientistId;
    let factId = req.params.factId;
    let store = res.locals.store;
    let isDeleted = await store.deleteFact(+sciId, +factId);

    if (!isDeleted) {
      throw new Error('Scientist or fact not found.');
    } else if (isDeleted === true) {
      req.flash('success', 'The fact has been deleted.');
      res.redirect(`/scientists/${sciId}?factpg=1`);
    }
  })
);

//Delete a scientist
app.post('/scientists/:scientistId/destroy',
  isAuthenticated,
  validateSciIdParam,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let sciId = req.params.scientistId;
    let isDeleted = await store.deleteScientist(+sciId);

    if (!isDeleted) {
      throw new Error('Scientist not found.');
    } else if (isDeleted === true) {
      req.flash('success', 'The scientist has been deleted.');
      res.redirect('/scientists?page=1');
    }
  })
);

//Display sign in page
app.get('/users/signin', (req, res) => {
  if (res.locals.signedIn) {
    res.redirect('/scientists?page=1');
  } else {
    let redirectPath = req.query.redirect || '/scientists?page=1';
    req.flash('info', 'Please sign in');
    res.render('signin', {
      redirectPath,
      flashObj: req.flash()
    });
  }
});

//Route handles signing in
app.post('/users/signin', 
  catchError(async (req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;
    let store = res.locals.store;
    let authenticated = await store.authenticate(username, password);
    let redirectPath = req.query.redirect;
    
    if (!authenticated) {
      req.flash('error', 'Invalid username/password combination');
      res.render('signin', {
        redirectPath,
        flashObj: req.flash(),    
        username: req.body.username
      });
    } else {
      let session = req.session;
      session.username = username;
      session.signedIn = true;

      req.flash('info', 'Welcome!');
      res.redirect(redirectPath);
    }
  })
);

//Route handles signing out
app.post('/users/signout', (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect('/users/signin');
});

//Handles invalid paths
app.all('*', (req, res) => {
  res.status(404).send('Resource not found, sorry. :(');
});

// Error handler
app.use((err, req, res, _next) => {
  console.log('error handler runs....');
  res.status(404).send(err.message);
});

app.listen(port, host, () => {
  console.log(`app is listening on port ${port} of ${host}!`);
});