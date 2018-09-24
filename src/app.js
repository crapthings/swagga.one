import path from 'path'
import fs from 'fs-plus'
import electron from 'electron'
import _ from 'lodash'
import React, { Component } from 'react'
import { render } from 'react-dom'
import randomcolor from 'randomcolor'
import chokidar from 'chokidar'

const BYPASS_FOLDERS = ['.DS_Store']

export default class App extends Component {
  state = {
    baseFolder: null,
    folders: [],
    perRow: 3,
  }

  preventDefault = evt => {
    evt.preventDefault()
  }

  componentWillMount() {
    window.addEventListener('dragenter', this.preventDefault)
    window.addEventListener('dragover', this.preventDefault)
    window.addEventListener('drop', this.onDropFolder)
    this.watcher = this.watchBaseFolder()
  }

  componentWillUnmount() {
    window.removeEventListener('dragenter', this.preventDefault)
    window.removeEventListener('dragover', this.preventDefault)
    window.removeEventListener('drop', this.onDropFolder)
    if (this.watcher) this.watcher.close()
  }

  watchBaseFolder = () => {
    const baseFolder = localStorage.getItem('baseFolder')
    if (!baseFolder) return
    this.setState({ baseFolder })
    return chokidar.watch(baseFolder, {
      depth: 0,
    }).on('all', (event, path) => {
      if (!_.includes(['addDir', 'unlinkDir'], event)) return
      const folders = _.reject(fs.readdirSync(baseFolder), folder => _.includes(BYPASS_FOLDERS, folder))
      console.log(folders)
      this.setState({ folders })
    })
  }

  onDropFolder = evt => {
    const folder = _.get(evt, 'path[0].dataset.folder')
    if (!folder) return
    const baseFolder = localStorage.getItem('baseFolder')
    const targetFolder = `${baseFolder}/${folder}`
    _.each(evt.dataTransfer.files, file => {
      const filepath = file.path
      const filename = file.name
      const extname = path.extname(filename)
      const targetpath = `${targetFolder}/${filename}`
      if (fs.existsSync(targetpath)) {
        const newfilename = path.basename(filename, extname) + ' ' + Date.now() + extname
        fs.moveSync(filepath, `${targetFolder}/${newfilename}`)
      } else {
        fs.moveSync(filepath, `${targetFolder}/${filename}`)
      }
    })
  }

  pickBaseFolder = () => {
    const baseFolder = electron.remote.dialog.showOpenDialog({ properties: ['openDirectory'] })
    localStorage.setItem('baseFolder', baseFolder)
    this.setState({ baseFolder })
    this.watchBaseFolder()
    return baseFolder
  }

  newFolder = evt => {
    evt.preventDefault()
    const baseFolder = localStorage.getItem('baseFolder')
    if (_.isEmpty(baseFolder)) return
    const folders = this.state.folders
    const name = _.trim(evt.target[0].value)
    if (!name) return
    const folderpath = `${baseFolder}/${name}`
    if (_.includes(folders, name)) return
    if (!fs.existsSync(folderpath)) fs.makeTreeSync(folderpath)
    this.refs.reset.click()
  }

  removeFolder = ({ folder }) => {
    const baseFolder = localStorage.getItem('baseFolder')
    const targetFolder = `${baseFolder}/${folder}`
    const targetFolderIsEmpty = _.chain(fs.readdirSync(targetFolder)).reject(folder => _.includes(BYPASS_FOLDERS, folder)).value()
    if (targetFolderIsEmpty.length) return
    fs.removeSync(targetFolder)
  }

  render() {
    return (
      this.state.baseFolder ? (
        <div id='dropform'>
          <div className='drop-header'>

          </div>

          <div className='drop-main'>
            <div className='drop-side'>

            </div>

            <div className='drop-area'>
              {_.chunk(this.state.folders, this.state.perRow).map((rows, rowsIdx) => (
                <div className='droprow' key={rowsIdx}>{rows.map(folder => (
                  <div style={{ backgroundColor: randomcolor({ luminosity: 'dark' }), color: 'white' }} key={folder} className='dropfolder' data-folder={folder}>{folder} <button onClick={() => this.removeFolder({ folder })}>remove</button></div>
                ))}</div>
              ))}
            </div>

            <div className='drop-side'>

            </div>
          </div>

          <div className='drop-footer'>

          </div>
        </div>
      ) : (
        <div>
          {this.state.baseFolder && <div>{this.state.baseFolder}</div>}
          <div>
            <div>
              <button onClick={this.pickBaseFolder}>pick base folder</button>
            </div>

            <form onSubmit={this.newFolder}>
              <div>
                <input type='text' className='folder_name' placeholder='name' />
              </div>

              <div>
                <input type='submit' />
                <input type='reset' style={{ display: 'none' }} ref='reset' />
              </div>
            </form>
          </div>
        </div>
      )
    )
  }
}


render(<App />, document.getElementById('app'))
