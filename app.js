const express = require('express')

const path = require('path')

const {open} = require('sqlite')

const sqlite3 = require('sqlite3')
const format = require('date-fns/format')

const isMatch = require('date-fns/isMatch')

var isValid = require('date-fns/isValid')
const app = express()

app.use(express.json())

let database=null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, 'todoApplication.db'),
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is Running on http://localhost:3000/')
    })
  } catch (error) {
    console.log(`Database Error is ${error.message}`)
    
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const outPutResult = dbObject => {
  return {
    id: dbObject.id,

    todo: dbObject.todo,

    priority: dbObject.priority,
    category: dbObject.category,

    status: dbObject.status,

    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null

  let getTodosQuery = ''

  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
                
                SELECT * FROM todo WHERE status = '${status}' AND priority= '${priority}' ;`
          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)

        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `select * from todo where category='${category}' and status='${status}' ;`
          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `select * from todo where category='${category}' and priority='${priority}';`
          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `
                    
                SELECT * FROM todo WHERE priority='${priority}' ;`

        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)

        response.send('Invalid Todo Priority')
      }

      break
    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `SELECT * FROM todo WHERE status ='${status}';`

        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearchProperty(request.query):
      getTodosQuery = `select * from todo where todo like '%${search_q}%';`
      data = await database.all(getTodosQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))

      break
    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `select * from todo where category='${category}';`
        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      getTodosQuery = `select * from todo;`

      data = await database.all(getTodosQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodosQuery = `select * from todo where id=${todoId} ;`

  const responseResult = await database.get(getTodosQuery)

  response.send(outPutResult(responseResult))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))

  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')

    console.log(newDate)

    const requestQuery = `select * from todo where due_date='${newDate}';`

    const responseResult = await database.all(requestQuery)
    response.send(responseResult.map(eachItem => outPutResult(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodoQuery = `
                    
INSERT INTO 
                        
    todo (id, todo, category, priority, status, due_date)
VALUES 

    (${id}, '${todo}', '${category}', '${priority}', '${status}', '${postNewDueDate}');`

          await database.run(postTodoQuery)

          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)

        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  let updateColumn = ''

  const requestBody = request.body

  console.log(requestBody)

  const previousTodoQuery = `
  
  SELECT * FROM todo WHERE id = ${todoId};`

  const preiviousTodo = await database.get(previousTodoQuery)

  const {
    todo = preiviousTodo.todo,
    priority = preiviousTodo.priority,
    status = preiviousTodo.status,
    category = preiviousTodo.category,
    dueDate = preiviousTodo.dueDate,
  } = request.body

  let upadateTodoQuery
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        upadateTodoQuery = `
                
       UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
       due_date='${dueDate}' WHERE id = ${todoId} ;`

        await database.run(upadateTodoQuery)
        response.send(`Status Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }

      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        upadateTodoQuery = `
                  
    UPDATE todo SET  todo='${todo}', priority='${priority}', status='${status}', category='${category}',
       due_date='${dueDate}' WHERE id =${todoId} ;`

        await database.run(upadateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      upadateTodoQuery = `
            
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}', 
        due_date='${dueDate}'  WHERE id = ${todoId} ;`

      await database.run(upadateTodoQuery)
      response.send('Todo Updated')
      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        upadateTodoQuery = `
UPDATE  todo SET todo='${todo}', priority='${priority}', status ='${status}', category='%${category}',
   due_date='${dueDate}' WHERE id=${todoId} ;`

        await database.run(upadateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)

        response.send('Invalid Todo Category')
      }
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const NewDueDate = format(new Date(dueDate), 'yyyy-MM-dd')

        upadateTodoQuery = `
            
UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
   due_date='${NewDueDate}' WHERE id =${todoId} ;`

        await database.run(upadateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)

        response.send('Invalid Due Date')
      }

      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
    DELETE 
    FROM 
    
    todo 

    WHERE
    id =${todoId} ;`

  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
