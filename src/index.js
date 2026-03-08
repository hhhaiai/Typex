/*
 * @Author: caiwu
 * @Description:
 * @CreateDate:
 * @LastEditor:
 * @LastEditTime: 2022-08-26 15:22:44
 */
import createEditor from 'editor'
import './style.styl'
import { createDemoApp } from './demo/app'

setTimeout(() => {
  createDemoApp({
    createEditorImpl: createEditor,
  })
}, 0)
