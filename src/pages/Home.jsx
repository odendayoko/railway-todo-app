import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import axios from 'axios'
import { Header } from '../components/Header'
import { url } from '../const'
import './home.scss'

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo') // todo->未完了 done->完了
  const [lists, setLists] = useState([])
  const [selectListId, setSelectListId] = useState()
  const [tasks, setTasks] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [cookies] = useCookies()
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value)
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data)
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`)
      })
  }, [])

  useEffect(() => {
    const listId = lists[0]?.id
    if (typeof listId !== 'undefined') {
      setSelectListId(listId)
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks)
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`)
        })
    }
  }, [lists])

  const handleSelectList = (id) => {
    setSelectListId(id)
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks)
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`)
      })
  }
  return (
    <>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div className="list-header">
          <h2>リスト一覧</h2>
          <div className="list-menu">
            <p>
              <Link to="/list/new">リスト新規作成</Link>
            </p>
            <p>
              <Link to={`/lists/${selectListId}/edit`}>
                選択中のリストを編集
              </Link>
            </p>
          </div>
        </div>
        <ul
          className="list-tab"
          role="tablist"
          aria-activedescendant={`list-tab-item-${selectListId}`}
        >
          {lists.map((list, key) => {
            const isActive = list.id === selectListId
            return (
              <li
                key={key}
                id={`list-tab-item-${list.id}`}
                className={`list-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectList(list.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectList(list.id)
                  } else if (e.key === 'ArrowRight') {
                    const nextIndex =
                      (lists.findIndex((l) => l.id === selectListId) + 1) %
                      lists.length
                    const nextListId = lists[nextIndex].id
                    handleSelectList(nextListId)
                  } else if (e.key === 'ArrowLeft') {
                    const prevIndex =
                      (lists.findIndex((l) => l.id === selectListId) -
                        1 +
                        lists.length) %
                      lists.length
                    const prevListId = lists[prevIndex].id
                    handleSelectList(prevListId)
                  }
                }}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
              >
                {list.title}
              </li>
            )
          })}
        </ul>
        <div className="tasks">
          <div className="tasks-header">
            <h2>タスク一覧</h2>
            <p className="tasks-createButton">
              <Link to="/task/new">タスク新規作成</Link>
            </p>
          </div>
          <div className="display-select-wrapper">
            <select
              onChange={handleIsDoneDisplayChange}
              className="display-select"
            >
              <option value="todo">未完了</option>
              <option value="done">完了</option>
            </select>
          </div>
          <Tasks
            tasks={tasks}
            selectListId={selectListId}
            isDoneDisplay={isDoneDisplay}
          />
        </div>
      </main>
    </>
  )
}

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props

  const formattedLimitDate = (dateTimeString) => {
    const dateTime = new Date(dateTimeString)
    const year = dateTime.getFullYear()
    const month = String(dateTime.getMonth() + 1).padStart(2, '0')
    const day = String(dateTime.getDate()).padStart(2, '0')
    const hours = String(dateTime.getHours()).padStart(2, '0')
    const minutes = String(dateTime.getMinutes()).padStart(2, '0')
    const formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}`
    return formattedDateTime
  }

  const getRemainingTime = (limitDateString) => {
    const currentDate = new Date()
    const limitDate = new Date(limitDateString)
    const diffInMilliseconds = limitDate.getTime() - currentDate.getTime()
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(
      (diffInMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    )
    const diffInMinutes = Math.floor(
      (diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60),
    )

    return `（残り${diffInDays}日${diffInHours}時間${diffInMinutes}分）`
  }

  if (tasks === null) return <></>

  if (isDoneDisplay == 'done') {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                {task.title}
                <br />
                {formattedLimitDate(task.limit)}
                <br />
                {task.done ? '完了' : '未完了'}
              </Link>
            </li>
          ))}
      </ul>
    )
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false
        })
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link
              to={`/lists/${selectListId}/tasks/${task.id}`}
              className="task-item-link"
            >
              {task.title}
              <br />
              {formattedLimitDate(task.limit)}
              {getRemainingTime(task.limit)}
              <br />
              {task.done ? '完了' : '未完了'}
            </Link>
          </li>
        ))}
    </ul>
  )
}
