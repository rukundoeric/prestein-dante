/* eslint-disable no-self-assign */
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React, { Component } from 'react'
import Dante from 'Dante2'
import PropTypes from 'prop-types'
import TagsInput from 'react-tagsinput'
let currentUploadImagePos = 0

class Editor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tags: [],
      editorState: this.props.edtrState,
      article: {},
      currentUploadImagePos: 0,
      images: [],
      readTopublish: false,
      blocks: [],
      isUpdating: false,
      slug: ''
    }
    this.handleChangeTags = this.handleChangeTags.bind(this)
    this.getCurrentBlock = this.getCurrentBlock.bind(this)
    this.upDateBlocks = this.upDateBlocks.bind(this)
  }

  componentWillMount() {
    const { tags, slug, isUpdating, images } = this.props
    this.setState({ tags: tags || [], slug, isUpdating: isUpdating || false, images })
  }

  static getCurrentUploadImagePos = () => currentUploadImagePos;

  // componentWillReceiveProps(newProps) {
  //   const { NewUploadedImage, NewArticle } = newProps
  //   if (NewUploadedImage.secure_url) {
  //     const { images } = this.state
  //     images.push({
  //       position: this.state.currentUploadImagePos,
  //       url: NewUploadedImage.secure_url
  //     })
  //     this.setState({ images })
  //   }
  //   if (NewArticle.article) {
  //     console.log(NewArticle)
  //   }
  // }

  getCurrentBlockKey = newBlocks => {
    const out = newBlocks.filter(
      block => !this.state.blocks.includes(block.key)
    )[0]
    if (out) {
      return out.key
    }
    return newBlocks[newBlocks.length - 1].key
  };

  getCommonItems = (currentBlocks, newBlocks) => {
    let result = []
    result = result.concat(
      currentBlocks.filter(item => newBlocks.indexOf(item.key) >= 0)
    )
    return result
  };

  getCurrentBlockPosition = (blocks, key) => {
    let out = 0
    for (let i = 0; i < blocks.length; i += 1) {
      if (blocks[i].key === key) {
        out = i
        break
      }
    }
    return out
  };

  getCurrentBlock(blocks) {
    return blocks.find(block => block.key === this.getCurrentBlockKey(blocks))
  }

  isImageAlreadyAdded = key => {
    const image = this.state.blocks.find(blk => blk === key)
    if (image) {
      return true
    }
    return false
  };

  upDateBlocks = blocks => {
    const newBlocks = []
    blocks.forEach(block => {
      newBlocks.push(block.key)
    })
    this.setState({ blocks: newBlocks })
  };

  removeDeletedBlocks = newBlocks => {
    const currentBlocks = this.state.blocks
    const blocks = this.getCommonItems(currentBlocks, newBlocks)
    this.setState({ blocks })
  };

  save = state => {
    const editorState = state.editorState()
    const title = editorState.getCurrentContent().getFirstBlock().text
    let data
    if (
      state.editorContent.blocks.length === 1 &&
      state.editorContent.blocks[0].text === ''
    ) {
      // eslint-disable-next-line
      const { editorState } = this.state;
      data = {
        article: {
          body: JSON.stringify(editorState),
          title,
          description: title,
          // eslint-disable-next-line
          tagList: this.state.tags
        }
      }
      localStorage.setItem('article', JSON.stringify(data))
      return
    }
    data = {
      article: {
        body: JSON.stringify(state.editorContent),
        title,
        description: title,
        // eslint-disable-next-line
        tagList: this.state.tags
      }
    }

    this.setState({ article: data })

    localStorage.setItem('article', JSON.stringify(data))
  };

  handleSave = state => {
    const { blocks } = state.editorContent
    const currentBlock = this.getCurrentBlock(blocks)
    const currentBlockKey = this.getCurrentBlockKey(blocks)
    if (
      currentBlock.type === 'image' &&
      !this.isImageAlreadyAdded(currentBlockKey)
    ) {
      const { file } = currentBlock.data
      const currentImagePos = this.getCurrentBlockPosition(
        blocks,
        currentBlockKey
      )
      currentUploadImagePos = currentImagePos
      this.props.uploadImage(file)
      this.save(state)
    } else {
      this.save(state)
    }
    this.removeDeletedBlocks(blocks)
    this.upDateBlocks(blocks)
  };

  readTopublish = async () => {
    const article = JSON.parse(localStorage.getItem('article'))
    const { blocks } = JSON.parse(article.article.body)
    this.state.images.forEach(image => {
      blocks[image.position].data.url = image.url
    })
    article.article.body = { blocks }
    return article
  };

  publishArticleHandler = () => {
    const { tags, article } = this.state
    const { body, title } = this.props.getFromEditor(article)
    this.props.createArticle({
      title,
      description: body,
      body: JSON.stringify(article),
      tagList: tags.join(',')
    })
  };

  updateArtcileHandler = slug => {
    const { tags, article } = this.state
    const { body, title } = this.props.getFromEditor(article)
    this.props.updateArticle(
      {
        title,
        description: body,
        body: JSON.stringify(article),
        tagList: tags.join(',')
      },
      slug
    )
  };

  handleChangeTags(tags) {
    this.setState({ tags })
  }

  render() {
    const titl = (
      <div style={{ fontSize: 25, fontWeight: 'bold' }}>
        Enter the title ....
      </div>
    )
    if (this.state.readTopublish) {
      const { body, title } = this.props.getFromEditor(this.state.article)
      const { tags, slug } = this.state
      return (
        <div>
          <section className='editor-main-section-r'>
            <main className='editor-main-r row mt-6 mb-5'>
              <div className='itemcontainer'>
                <div className='content row mt-5 mb-5 ml-4'>
                  <div className='alert alert-primary' role='alert'>
                    {this.state.isUpdating
                      ? 'The Article is ready to be Updated.'
                      : 'The Article is ready to be published.'}
                  </div>
                  <div className='col-lg-10'>
                    <div className='row'>
                      <p
                        htmlFor='story_title'
                        className='read-published-title h5 text-dark font-weight-bold'
                        onClick={() => this.setState({ readTopublish: false })}
                      >
                        {title}
                      </p>
                    </div>
                    <div className='row'>
                      <p
                        htmlFor='story_description'
                        className='read-published-div text-secondary font-weight-light'
                        onClick={() => this.setState({ readTopublish: false })}
                      >
                        {body}
                      </p>
                    </div>
                    <div className='row'>
                      <TagsInput
                        value={tags}
                        onChange={this.handleChangeTags}
                      />
                    </div>
                    <div className='row'>
                      <button
                        type='submit'
                        className='publishbutton'
                        onClick={
                          this.state.isUpdating
                            ? () => this.updateArtcileHandler(slug)
                            : () => this.publishArticleHandler()
                        }
                      >
                        {this.state.isUpdating ? 'Apply' : 'Publish'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </section>
        </div>
      )
    }
    return (
      <section className='editor-main-section container'>
        <main className='editor-main row mt-6 mb-5'>
          <div className='alert alert-light' role='alert'>
            <button
              type='submit'
              className='publishbutton'
              onClick={() =>
                this.readTopublish().then(article => {
                  const { blocks } = article.article.body
                  this.setState({
                    article,
                    readTopublish: true,
                    editorState: {
                      blocks,
                      entityMap: {}
                    }
                  })
                })
              }
            >
              {this.state.isUpdating ? 'Ready to Update' : 'Ready to Publish'}
            </button>
          </div>
          <div className='col-lg-9 left-nav'>
            <Dante
              body_placeholder={titl}
              content={this.state.editorState}
              spellcheck
              data_storage={{
                method: 'POST',
                save_handler: this.handleSave,
                interval: 100,
                withCredantials: true
              }}
            />
          </div>
        </main>
      </section>
    )
  }
}

Editor.propTypes = {
  slug: PropTypes.string.isRequired,
  tags: PropTypes.array.isRequired,
  uploadImage: PropTypes.func.isRequired,
  createArticle: PropTypes.func.isRequired,
  edtrState: PropTypes.instanceOf(Object).isRequired,
  updateArticle: PropTypes.func.isRequired
}

export default Editor
