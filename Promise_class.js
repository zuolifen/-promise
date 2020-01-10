//该文件模拟原生Promise

(function(){

	const PENDING = 'pending' //定义常量，存储初始化状态字符
	const RESOLVED = 'resolved' //定义常量，存储成功状态字符
	const REJECTED = 'rejected' //定义常量，存储失败状态字符

	//Promise构造函数
	class Promise{
		constructor(excutor){
			const self = this //缓存this
			self.status = PENDING //初始化实例的状态
			self.data = undefined //初始化实例所保存的数据（可能是成功的value，或是失败的reason）
			self.callbacks = [] //用于保存一组一组的回调函数，
			excutor(self.resolve,self.reject)
		}
		/* 
				self.callbacks形如：[
															{onResolved:()=>{},onRejected:()=>{}},
															{onResolved:()=>{},onRejected:()=>{}}
														]
			*/

			//调用resolve会：1.内部状态改为resolved，2.保存成功的value，3.去callbacks中取出所有的onResolved依次异步调用
			resolve(value){
				if(self.status !== PENDING) return
				//1.内部状态改为resolved
				self.status = RESOLVED
				//2.保存成功的value
				self.data = value
				//3.去callbacks中取出所有的onResolved依次异步调用
				setTimeout(()=>{
					self.callbacks.forEach((cbkObj)=>{
						cbkObj.onResolved(value)
					})
				})
			}

			//调用reject会：1.内部状态改为rejected，2.保存失败的reason，3.去callbacks中取出所有的onRejected依次异步调用
			reject(reason){
				if(self.status !== PENDING) return
				//1.内部状态改为rejected
				self.status = REJECTED
				//2.保存失败的reason
				self.data = reason
				//3.去callbacks中取出所有的onRejected依次异步调用
				setTimeout(()=>{
					self.callbacks.forEach((cbkObj)=>{
						cbkObj.onRejected(reason)
					})
				})
			}

			then (onResolved,onRejected){
				const self = this
				//下面这行代码，作用是：将错误的reason一层一层抛出
				onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw(reason)}
				//下面这行代码，作用是：让catch具有传递功能
				onResolved = typeof onResolved === 'function' ? onResolved : value => value
				return new Promise((resolve,reject)=>{
					//专门用于执行onResolved,onRejected
					function handle (callback){
						try {
							let result = callback(self.data)
							if(!(result instanceof Promise)){
								//进入此判断，意味着：onResolved的返回值是一个，非Promise实例
								resolve(result)
							}else{
								//进入此else，意味着：onResolved的返回值是一个Promise实例
								result.then(
									value => resolve(value),
									reason => reject(reason)
								)
							}
						} catch (error) {
							reject(error)
						}
					}
					//1.如果调用then的时候，Promise实例状态为resolved，去执行onResolved回调。
					if(self.status === RESOLVED){
						setTimeout(()=>{
							handle(onResolved)
						})
					}
					//2.如果调用then的时候，Promise实例状态为rejected，去执行onRejected回调。
					else if(self.status === REJECTED){
						setTimeout(()=>{
							handle(onRejected)
						})
					}
					//3.如果调用then的时候，Promise实例状态为pending，不去执行回调，去将onResolved和onRejected保存起来 
					else{
						self.callbacks.push({
							onResolved:function(){
								handle(onResolved)
							},
							onRejected:function(){
								handle(onRejected)
							}
						})
					}
				})
			}
		
			catch (onRejected){
				return this.then(undefined,onRejected)
			}

			static resolve(value){
				return new Promise((resolve,reject)=>{
					if(value instanceof Promise){
						value.then(
							val => resolve(val),
							reason => reject(reason)
						)
					}else{
						resolve(value)
					}
				})
			}
			
			static reject(reason){
				return new Promise((resolve,reject)=>{
					reject(reason)
				})
			}
		
			static all(promiseArr){
				return new Promise((resolve,reject)=>{
					let resolvedCount = 0
					let values = []
					promiseArr.forEach((promise,index)=>{
						promise.then(
							value => {
								resolvedCount++
								values[index] = value
								if(resolvedCount === promiseArr.length){
									resolve(values)
								}
							},
							reason => reject(reason)
						)
					})
				})
			}
		
			static race(promiseArr){
				return new Promise((resolve,reject)=>{
					promiseArr.forEach((promise)=>{
						promise.then(
							value => resolve(value),
							reason => reject(reason)
						)
					})
				})
			}
		
			static resolveDelay(value,time){
				return new Promise((resolve,reject)=>{
					setTimeout(()=>{
						if(value instanceof Promise){
							value.then(
								val => resolve(val),
								reason => reject(reason)
							)
						}else{
							resolve(value)
						}
					},time)
				})
			}
		
			static rejectDelay(reason,time){
				return new Promise((resolve,reject)=>{
					setTimeout(()=>{
						reject(reason)
					},time)
				})
			}
	}

	//替换掉window上的Promise
	window.Promise = Promise
})()