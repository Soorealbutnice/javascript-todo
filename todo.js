class Todo {
    constructor(History, Output, CheckError, AddWiseSaying) {
        this.todoList = [];
        this.History = History;
        this.Output = Output;
        this.CheckError = CheckError;
        this.AddWiseSaying = AddWiseSaying;
    }

    init() {
        if(!this.CheckError.init(this.todoList)) return;
        const allDataObj = {dataList: this.todoList}
        this.History.saveInitData(allDataObj)
        this.todoList = [];
        this.Output.init(this.todoList)
    }

    getStatusNum(accumulatedTask) {
        let statusNum = new InitStatusNum(0, 0, 0)
        accumulatedTask.forEach(obj => {
            statusNum[obj.status]++
        })
        return statusNum
    }

    add(objToAdd) {
        if(!this.CheckError.add(objToAdd, this.todoList)) return;
        const newTodo = new Task(this.getRanNum(this.todoList), objToAdd.name, 'todo', objToAdd.tag, 0)
        this.todoList.push(this.checkTag(newTodo));
        let statusNum = this.getStatusNum(this.todoList)
        this.Output.changes('add', newTodo)
        this.Output.nowStatus(statusNum)
        this.History.saveAddData(newTodo)
        this.Output.wiseSaying(this.AddWiseSaying.getWiseSaying());
    }//add

    getRanNum(todoList) {
        const ranNum = Math.floor(Math.random() * 30)
        const idArrays = todoList.map(obj => obj.id)
        if (idArrays.includes(ranNum)) {
            return this.getRanNum(this.todoList)
        }
        return ranNum;
    }//for add1

    checkTag(newTask) {
        if (newTask.tag === undefined) {
            newTask.tag = 'nothing'
        }
        return newTask
    }//for add2

    remove(objToRemove) {
        if(!this.CheckError.remove(objToRemove, this.todoList)) return;
        const toRemoveData = this.todoList.filter(obj => obj.id === objToRemove.id)[0]
        this.Output.changes('remove', toRemoveData)
        this.History.saveRemoveData(toRemoveData)
        this.todoList = this.todoList.filter(obj => obj.id !== objToRemove.id)
    }//remove

    update(objToUpdate) {
        if(!this.CheckError.update(objToUpdate, this.todoList)) return;
        objToUpdate.nextstatus = objToUpdate.nextstatus.toLowerCase().replace(/ /gi, "")
        const beforeData = this.copyData(this.todoList, objToUpdate)
        this.todoList = this.getUpdatedList(this.todoList, objToUpdate)
        this.todoList = this.checkUpdateStatus(objToUpdate, this.todoList)
        const updatedData = this.copyData(this.todoList, objToUpdate)
        const statusNum = this.getStatusNum(this.todoList);
        this.Output.changes('update', updatedData[0], beforeData[0])
        this.Output.nowStatus(statusNum)
        this.History.saveUpdateData(updatedData[0], beforeData[0])
    }//update

    getUpdatedList(todoTask, objToUpdate) {
        todoTask.map(obj => {
            if (obj.id === objToUpdate.id) {
                obj.status = objToUpdate.nextstatus
                return obj
            }
            return obj
        })
        return todoTask
    }//for update1

    copyData(todoTask, objToUpdate) {
        const Data = [];
        todoTask.forEach(obj => {
            if(obj.id === objToUpdate.id) {
                Data.push(new Task(obj.id, obj.name, obj.status, obj.tag, obj.timeData))
            }
        })
        return Data
    }//for update2

    checkUpdateStatus(objToUpdate, todoList) {
        if (objToUpdate.nextstatus === 'doing') {
            return this.updateDoingTime(objToUpdate, todoList)
        } else if (objToUpdate.nextstatus === 'done') {
            return this.updateTakeTime(objToUpdate, todoList)
        }
        return todoList
    }//for update3

    updateDoingTime(objToUpdate, todoList) {
        todoList.forEach(obj => {
            if (obj.id === objToUpdate.id) {
                obj.timeData = Date.now();
            }
        })
        return todoList
    }//for update4

    updateTakeTime(objToUpdate, todoList) {
        todoList.forEach(obj => {
            if (obj.id === objToUpdate.id) {
                obj.timeData = this.getTakeTime(obj.timeData, Date.now())
            }
        })
        return todoList
    }//for update5

    getTakeTime(doingTime, currentTime) {
        let takenTime = ''
        if (doingTime === 0) {
            takenTime += '한번에 해결'
            return takenTime
        }
        let takenMsecTime = currentTime - doingTime
        const msecPerMinute = 1000 * 60, msecPerHour = msecPerMinute * 60, msecPerDay = msecPerHour * 24
        const takenDays = Math.floor(takenMsecTime / msecPerDay)
        takenMsecTime = takenMsecTime - takenDays * msecPerDay
        const takenHours = Math.floor(takenMsecTime / msecPerHour)
        takenMsecTime = takenMsecTime - takenHours * msecPerHour
        const takenMinutes = Math.floor(takenMsecTime / msecPerMinute)
        takenMsecTime = takenMsecTime - takenMinutes * msecPerMinute
        takenTime += takenDays + '일, ' + takenHours + '시간, ' + takenMinutes + '분'
        return takenTime;
    }//for update6

    undo() {
        this.todoList = this.History.undo(this.todoList)
    }

    redo() {
        this.todoList = this.History.redo(this.todoList)
    }

    show(status) {
        if(!this.CheckError.show(status, this.todoList)) return;
        this.Output.status(this.todoList, status)
    }

    showTag(tag) {
        if (tag !== undefined) {
            this.Output.haveTag(tag, this.todoList)
            return;
        }
        this.Output.notHaveTag(tag, this.todoList)
    }

    showTags() {
        const taggedTodos = this.todoList.filter(obj => obj.tag !== 'noting')
        const sameTagList = this.Output.getTagList(taggedTodos);
        sameTagList.forEach(tag => {
            const sameTagNum = this.Output.getSameTagNum(tag, taggedTodos)
            this.Output.printSameTag(tag, taggedTodos, sameTagNum)
        })
    }

    showAll() {
        this.Output.all(this.todoList)
    }
}


class History {
    constructor(Output) {
        this.dataList = [];
        this.undoList = [];
        this.Output = Output
    }

    saveAddData(newTodo) {
        this.dataList.push({ method: 'add', addedData: newTodo })
        this.checkListNum(this.dataList)
    }

    saveRemoveData(removeData) {
        this.dataList.push({ method: 'remove', removedData: removeData })
        this.checkListNum(this.dataList)
    }

    saveUpdateData(updatedData, beforeData) {
        this.dataList.push({ method: 'update', updatedData: updatedData, beforeData: beforeData })
        this.checkListNum(this.dataList)
    }

    saveInitData(initData) {
        this.dataList.push({ method: 'init', initedData: initData.dataList})
        this.checkListNum(this.dataList)
    }

    checkListNum(array) {
        const limitNum = 3
        while (array.length > limitNum) {
            array.shift()
        }
        return array
    }

    undo(todoTask) {
        let task = this.dataList.pop()
        if (task === undefined) {
            console.log(`undo는 3회이상 실행 할 수 없습니다.`)
            return todoTask;
        }
        if (task.method === 'add') {
            this.undoList.push(task)
            return this.undoAdd(todoTask, task)
        } else if (task.method === 'remove') {
            this.undoList.push(task)
            return this.undoRemove(todoTask, task)
        } else if (task.method === 'update') {
            this.undoList.push(task)
            return this.undoUpdate(todoTask, task)
        } else if (task.method === 'init') {
            this.undoList.push(task)
            return this.undoInit(todoTask, task)
        }
    }//check

    undoInit(todoTask, task) {
        todoTask = task.initedData
        this.Output.init(todoTask)
        return todoTask
    }

    undoAdd(todoTask, task) {
        this.Output.changes('remove', task.addedData)
        todoTask = todoTask.filter(obj => obj.id !== task.addedData.id)
        return todoTask
    }//add

    undoRemove(todoTask, task) {
        todoTask.push(task.removedData)
        this.Output.changes('add', task.removedData)
        return todoTask
    }//remove

    undoUpdate(todoTask, task) {
        this.Output.changes('update', task.beforeData, task.updatedData)
        todoTask = this.resetUpdate(todoTask, task.beforeData)
        return todoTask
    }//update

    resetUpdate(todoTask, beforeData) {
        todoTask = todoTask.map(taskObj => {
            if (beforeData.id === taskObj.id) {
                taskObj.status = beforeData.status
                taskObj.timeData = beforeData.timeData
                return taskObj
            }
            return taskObj
        })
        return todoTask
    }//for undoupdate

    redo(todoTask, undid) {
        undid = this.undoList.pop()
        if (undid === undefined) {
            console.log(`undo된 값이 존재하지 않습니다.`)
            return todoTask;
        }
        if (undid.method === 'add') {
            this.dataList.push(undid)
            this.checkListNum(this.dataList)
            return this.redoAdd(todoTask, undid)
        } else if (undid.method === 'remove') {
            this.dataList.push(undid)
            this.checkListNum(this.dataList)
            return this.redoRemove(todoTask, undid)
        } else if (undid.method === 'update') {
            this.dataList.push(undid)
            this.checkListNum(this.dataList)
            return this.redoUpdate(todoTask, undid)
        } else if (undid.method === 'init') {
            this.dataList.push(undid)
            this.checkListNum(this.dataList)
            return this.redoInit(todoTask)
        }
    }

    redoInit(todoTask) {
        todoTask = [];
        this.Output.init(todoTask)
        return todoTask
    }

    redoAdd(todoTask, undid) {
        todoTask.push(undid.addedData)
        this.Output.changes('add', undid.addedData)
        return todoTask
    }//remove

    redoRemove(todoTask, undid) {
        this.Output.changes('remove', undid.removedData)
        todoTask = todoTask.filter(obj => obj.id !== undid.removedData.id)
        return todoTask
    }//add

    redoUpdate(todoTask, undid) {
        this.Output.changes('update', undid.updatedData, undid.beforeData)
        todoTask = this.resetUpdate(todoTask, undid.updatedData)
        return todoTask
    }//update
}


class Output {
    init(todoTask) {
        if(todoTask.length === 0) {
            console.log(`할 일이 초기화되었습니다. 후회되신다면 undo를....`);
        } else {
            console.log(`잘 생각 하셨습니다. 다시 되돌려놓았습니다.`)
        }
    }

    wiseSaying(wiseSaying) {
        console.log(wiseSaying)
    }

    nowStatus(statusNum) {
        console.log(`현재상태 todo : ${statusNum.todo}, doing: ${statusNum.doing}, done : ${statusNum.done}`)
    }

    changes(method, objToPrint, beforeChangeObj) {
        if (method === 'add') {
            console.log(`ID : ${objToPrint.id}, ${objToPrint.name} 항목이 추가되었습니다.`);
        } else if (method === 'remove') {
            console.log(`ID : ${objToPrint.id}, ${objToPrint.name} 삭제 완료`)
        } else {
            console.log(`ID : ${objToPrint.id}, ${objToPrint.name} 항목이 ${beforeChangeObj.status} => ${objToPrint.status} 상태로 변경 되었습니다.`)
        }
    }

    status(todoList, status) {
        console.log(`--${status} 상태인 할 일들--`);
        todoList.forEach(obj => {
            if (status === 'done' && obj.status === 'done') {
                console.log(`ID : ${obj.id}, ${obj.name}, [${obj.tag}], ${obj.timeData}`)
            } else if (obj.status === status) {
                console.log(`ID : ${obj.id}, ${obj.name}, [${obj.tag}]`)
            }
        })
    }//OutputStatus

    haveTag(tag, todoList) {
        console.log(`--태그가 [${tag}]인 할 일들--`);
        this.byTag(tag, todoList)
    }//showTag

    notHaveTag(tag, todoList) {
        console.log(`--태그가 없는 할 일들--`);
        this.byTag('noting', todoList)
    }//showTag

    byTag(tag, todoList) {
        const todoNum = this.getSameTagAndStatusNum(tag, 'todo', todoList)
        console.log(`[todo, 총 ${todoNum}개]`)
        this.sameTag(tag, 'todo', todoList);
        const doingNum = this.getSameTagAndStatusNum(tag, 'doing', todoList)
        console.log(`[doing, 총 ${doingNum}개]`)
        this.sameTag(tag, 'doing', todoList);
        const doneNum = this.getSameTagAndStatusNum(tag, 'done', todoList)
        console.log(`[done, 총 ${doneNum}개]`)
        this.sameTag(tag, 'done', todoList);
    }//for tag

    sameTag(tag, status, todoList) {
        const filteredList = todoList.filter(obj => obj.tag === tag && obj.status === status)
        filteredList.forEach(obj => {
            if (status === 'done') {
                console.log(`ID : ${obj.id}, ${obj.name}, ${obj.timeData}`)
                return;
            }
            console.log(`ID : ${obj.id}, ${obj.name}`)
        })
    }//for tag

    getSameTagAndStatusNum(tag, status, todoTask) {
        let sameTagAndStatusNum = 0
        todoTask.forEach(taskObj => {
            if (taskObj.tag === tag && taskObj.status === status) {
                sameTagAndStatusNum++
            }
        })
        return sameTagAndStatusNum
    }//for tag

    getTagList(taggedTask) {
        const tagList = taggedTask.map(obj => obj.tag)
        const notOverlapTagList = tagList.filter((tag, index, tagList) => tagList.indexOf(tag) === index)
        return notOverlapTagList
    }//현재 task배열 내에있는 모든 tag값들을 중복 없이 따로 모아놓는 배열을 만드는 메서드

    printSameTag(tag, taggedTask, sameTagNum) {
        console.log(`--[${tag}], 총 ${sameTagNum}개--`)
        taggedTask.forEach(taggedTaskObj => {
            if (tag === taggedTaskObj.tag) {
                console.log(`ID : ${taggedTaskObj.id}, ${taggedTaskObj.name}, [${taggedTaskObj.status}]`)
            }
        })
    }//tag의 값에 따라서 출력해주는 메서드

    getSameTagNum(tag, taggedTask) {
        let sameTagNum = 0
        taggedTask.forEach(taggedTaskObj => {
            if (tag === taggedTaskObj.tag) {
                sameTagNum++
            }
        })
        return sameTagNum
    }//같은 태그의 개수를 세어주는 메서드

    all(todoTask) {
        console.log(`총 ${todoTask.length}개의 리스트를 가져왔습니다.`)
        this.setTime(todoTask, 'todo')
    }//setTime메서드를 이용해서 재귀적으로 출력해주는 함수

    setTime(todoTask, status) {
        setTimeout(function () {
            this.status(todoTask, status)
            if (status === 'todo') {
                status = 'doing'
                this.setTime(todoTask, status)
            } else if (status === 'doing') {
                status = 'done'
                this.setTime(todoTask, status)
            } else if (status === 'done') {
                return;
            }
        }.bind(todo.Output), 2000)
    }
}


class CheckError {
    init(todoTask) {
        if(todoTask.length === 0) {
            console.log(`[error] 할 일이 아무것도 없는데 초기화한다구요?`)
            return false
        }
        return true
    }

    add(objToAdd, todoTask) {
        if ((todoTask.filter(taskObj => taskObj.name === objToAdd.name)).length !== 0) {
            console.log(`[error] 할 일 리스트에 같은 이름의 할 일이 존재합니다.`)
            return false
        };
        return true
    }//add

    remove(objToRemove, todoTask) {
        if (!todoTask.map(taskObj => taskObj.id).includes(objToRemove.id)) {
            console.log(`[error] 입력하신 id는 존재하지 않습니다. (입력하신 id : ${objToRemove.id})`);
            return false
        }
        return true
    }//remove

    update(objToUpdate, todoTask) {
        const compareTask = todoTask.filter(taskObj => objToUpdate.id === taskObj.id)
        if (!todoTask.map(taskObj => taskObj.id).includes(objToUpdate.id)) {
            console.log(`[error] 입력하신 id는 존재하지 않습니다. (입력하신 id : ${objToUpdate.id})`);
            return false
        }
        const status = objToUpdate.nextstatus.toLowerCase().replace(/ /gi, "")
        if (status !== 'doing' && status !== 'done' && status !== 'todo') {
            console.log(`[error] 그런 상태는 존재하지 않습니다 (입력하신 상태 : ${status})`)
            return false    
        } 
        if (compareTask[0].status === objToUpdate.nextstatus) {
            console.log(`[error] 이미 ${objToUpdate.nextstatus}인 상태입니다.`)
            return false
        } else if (compareTask[0].status === 'done' && status === 'doing' || status === 'todo') {
            console.log(`[error] ${compareTask[0].status}상태에서 ${objToUpdate.nextstatus}상태로 되돌아갈 수 없습니다.`)
            return false
        } else if (compareTask[0].status === 'doing' && status === 'todo') {
            console.log(`[error] ${compareTask[0].status}상태에서 ${objToUpdate.nextstatus}상태로 되돌아갈 수 없습니다.`)
            return false
        }
        return true
    }//update

    show(status) {
        if (status !== 'doing' && status !== 'done' && status !== 'todo') {
            console.log(`[error] 할 일 들의 상태는 todo나 doing이나 done이어야만 합니다. 대소문자의 구별에 유의하세요
모든 일들을 보고싶다면 todo.showAll()을 입력해 주세요.`);
            return false
        }
        return true
    }//show
}


class AddWiseSaying {
    constructor() {
        this.list = ['일곱 번 넘어져도, 여덟 번 일어나라.',
'어려움은 모든 것을 극복하는 것이다.',
'시간은 금이다',
'지나간 고통은 쾌락이다.',
'행함이 없는 믿음은 쓸모가 없다.',
'습관은 제2의 천성이다.',
'사람들은 고용되었을 때 최상의 만족을 느낀다',
'언제부터 천재가 존경받았는가?',
'가장 하기 힘든 일은 아무 일도 안하는 것이다.',
'웃으십시오.']
    }
    
    getWiseSaying() {
        const wiseSaying = this.list[Math.floor(Math.random() * this.list.length)]
        return wiseSaying
    }
}


class InitStatusNum {
    constructor(todo, doing, done) {
        this.todo = todo
        this.doing = doing
        this.done = done
    }
}


class Task {
    constructor(id, name, status, tag, timeData) {
        this.id = id
        this.name = name
        this.status = status
        this.tag = tag
        this.timeData = timeData
    }
}


const output = new Output();
const checkError = new CheckError();
const addWiseSaying = new AddWiseSaying();
const history = new History(output);
const todo = new Todo(history, output, checkError, addWiseSaying)

todo.showAll();
