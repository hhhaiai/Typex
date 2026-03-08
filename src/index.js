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
import { initSiteShell } from './siteShell'

setTimeout(() => {
  initSiteShell()
  createDemoApp({
    createEditorImpl: createEditor,
  })
}, 0)
