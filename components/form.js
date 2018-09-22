import path from 'path'
import fs from 'fs-plus'
import electron from 'electron'
import _ from 'lodash'
import React, { Component } from 'react'
import randomcolor from 'randomcolor'

export default class Form extends Component {
  state = {
    base_folder: null,
    folders: [],
  }

  componentWillMount() {
    const base_folder = localStorage.getItem('base_folder')
    const folders = this.getFolders() || []
    this.setState({ base_folder, folders })
  }

  componentDidMount() {
    window.addEventListener('dragenter', this.prevent)
    window.addEventListener('dragover', this.prevent)
    window.addEventListener('drop', this.onDrop)
  }

  componentWillUnmount() {
    window.removeEventListener('dragenter', this.prevent)
    window.removeEventListener('dragover', this.prevent)
    window.removeEventListener('drop', this.onDrop)
  }

  prevent = evt => {
    evt.preventDefault()
  }

  onDrop = evt => {
    const base_folder = this.getBaseFolder()
    const folder = _.get(evt, 'path[0].dataset.folder')
    if (!folder) return
    const targetFolder = `${base_folder}/${folder}`
    _.each(evt.dataTransfer.files, file => {
      const filepath = file.path
      const filename = file.name
      const extname = path.extname(filename)
      const targetpath = `${targetFolder}/${filename}`
      if (fs.existsSync(targetpath)) {
        const newfilename = path.basename(filename, extname) + ' ' + Date.now() + extname
        console.log(newfilename)
        fs.moveSync(filepath, `${targetFolder}/${newfilename}`)
      } else {
        fs.moveSync(filepath, `${targetFolder}/${filename}`)
      }
    })
  }

  newFolder = evt => {
    evt.preventDefault()
    const base_folder = this.getBaseFolder()
    const folders = this.getFolders()
    const name = _.trim(evt.target[0].value)
    if (!name) return
    const folderpath = `${base_folder}/${name}`
    if (_.includes(folders, name)) return
    if (!fs.existsSync(folderpath)) fs.makeTreeSync(folderpath)
    folders.push(name)
    this.setFolders({ folders })
    this.refs.reset.click()
  }

  getBaseFolder = () => {
    return localStorage.getItem('base_folder')
  }

  setBaseFolder = () => {
    const base_folder = electron.remote.dialog.showOpenDialog({ properties: ['openDirectory'] })
    localStorage.setItem('base_folder', base_folder)
    this.setState({ base_folder })
  }

  getFolders = () => {
    return JSON.parse(localStorage.getItem('folders')) || []
  }

  setFolders = ({ folders }) => {
    localStorage.setItem('folders', JSON.stringify(folders))
    this.setState({ folders })
  }

  removeFolder = ({ folder }) => {
    const base_folder = this.getBaseFolder()
    const files = _.reject(fs.readdirSync(`${base_folder}/${folder}`), file => file === '.DS_Store')
    console.log(files)
    if (files.length) return
    const folders = _.reject(this.getFolders(), f => f == folder)
    this.setFolders({ folders })
    fs.removeSync(`${base_folder}/${folder}`)
  }

  render() {
    return (
      <div id='dropform'>
        {this.state.base_folder && <div>{this.state.base_folder}</div>}
        <div>
          <div>
            <button onClick={this.setBaseFolder}>set base folder</button>
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

        <div id="dropzone">
          {_.chunk(this.state.folders, 5).map((rows, rowsIdx) => (
            <div className='droprow' key={rowsIdx}>{rows.map(folder => (
              <div style={{ backgroundColor: randomcolor({ luminosity: 'dark' }), color: 'white' }} key={folder} className='dropfolder' data-folder={folder}>{folder} <button onClick={() => this.removeFolder({ folder })}>remove</button></div>
            ))}</div>
          ))}
        </div>
      </div>
    )
  }
}
