const messages = {
  en: {
    common: {
      confirm: 'confirm',
      cancel: 'cancel',
      save: 'save',
    },
    tab: {
      Github: 'Github',
      Home: 'Home',
      Translate: 'Translate',
      About: 'About',
      List: 'List',
    },
    control: {
      first: 'First',
      next: 'Next',
      previous: 'Previous',
      review: 'Preview',
      index: 'Index',
    },
    translate: {
      translatePlaceholder:
        "Press Enter↩ to input '\\n' and press Shift⇧ + Enter↩ to save",
      saveSuccess: 'Saved',
      loadRawWarning: 'A raw json file is loaded',
      remoteTranslationDetected:
        'Remote translation is deteted. Click the toolbar【Switch】button switch',
      overwriteWarning: 'Overwrite Warning',
      overwriteDetails:
        'A history save of current file is detected. This action will OVERWRITE the existed histroy save',
      switch: {
        title: 'Switch Data Source',
        explanation: {
          raw: 'Raw json file',
          history: 'History save from browser',
          server: 'Translation by ShinyGroup',
          file: 'File from disk',
        },
        reloadTooltip: 'Requery translated file existence',
        reloadFinished: 'Requery finished',
      },
      rename: {
        title: 'Rename CSV File',
        defaultName: 'Default Name',
        originName: 'Origin Name',
        originNameNotFound: 'Origin name not found',
      },
      tab: {
        rename: 'Rename',
        complete: 'Complete',
        switch: 'Switch',
        top: 'TOP',
      },
    },
    push: {
      header: {
        title: 'Push to Github',
        login: 'Login',
        logout: 'Logout',
        scope: 'Read and write permission of personal repos required',
      },
      steps: {
        chooseBranch: 'Choose working branch',
        upload: 'Upload translation to working branch',
        prDetected:
          'Pull request detected, newly uploaded contents will be included in current PR',
        pr: 'Create pull request',
      },
      explanation: {
        title: 'Not familiar with the git workflow?',
        p1: 'Collaborating on GitHub is like a group of people working together on a document. To avoid confusion caused by everyone directly modifying the original document, we adopt a step-by-step approach.',
        p2: 'Create drafts for modifications, and finally present the content of the draft to the original author for review and merging.',
        step1:
          "Choose a working branch: Create a new draft (working branch) or select an existing one. This allows you to focus on your task, whether it's adding new content or revising existing content, without affecting the original document and the work of others.",
        step2:
          'Upload content to the branch: Save your local work results to your cloud draft.',
        step3:
          'Submit a merge request: Request to merge your modifications from the draft (working branch) back into the original document. This process allows the document author to review your changes and ensure the content is correct before merging.',
      },
    },
    home: {
      history: {
        title: 'History Saves',
        table: {
          name: 'File Name',
          URL: 'URL',
          latestUpdate: 'Latest Update',
        },
        clear: 'CLEAR HISTORY',
        clearWarning: 'Will Clear All History',
      },
      updates: 'Game Updates',
      changelog: 'Changelog',
    },
    list: {
      icon: 'Icon',
      name: 'Name',
      openAt: 'Release',
      translatedStatus: {
        title: 'Translation',
        full: {
          all: 'Translated',
          part: 'Partially Translated',
          no: 'Not Translated',
          empty: 'No Communication',
        },
        short: {
          all: 'Y',
          part: 'P',
          no: 'N',
          empty: '-',
        },
      },
    },
  },
  zh: {
    common: {
      confirm: '确认',
      cancel: '取消',
      save: '保存',
    },
    tab: {
      Github: 'Github',
      Home: '主页',
      Translate: '翻译',
      About: '关于',
      List: '列表',
    },
    control: {
      first: '回到最初',
      next: '下一节',
      previous: '上一节',
      review: '预览',
      index: '目录',
    },
    translate: {
      translatePlaceholder:
        "按下 Enter↩ 输入 '\\n'，\n按下 Shift⇧ + Enter↩ 保存",
      saveSuccess: '已保存',
      loadRawWarning: '当前加载源为原始 JSON 文件',
      remoteTranslationDetected:
        '检测到已翻译文件。点击工具栏【数据源切换】按钮切换',
      overwriteWarning: '历史修改将被覆盖',
      overwriteDetails:
        '检测到浏览器中当前文件的历史修改，本操作会覆盖历史修改，导致历史修改丢失',
      switch: {
        title: '切换数据源',
        explanation: {
          raw: '原始JSON文件',
          history: '浏览器中的历史修改',
          server: 'ShinyGroup维护的翻译文件',
          file: '磁盘中的文件',
        },
        reloadTooltip: '重新查询翻译文件是否存在',
        reloadFinished: '查询完成',
      },
      rename: {
        title: '设置 CSV 文件名',
        defaultName: '使用缺省名',
        originName: '使用文件原名',
        originNameNotFound: '未找到文件原名',
      },
      tab: {
        rename: 'CSV 更名',
        complete: '下载/推送',
        switch: '数据源切换',
        top: 'TOP',
      },
    },
    push: {
      header: {
        title: '推送到Github',
        login: '登录',
        logout: '登出',
        scope: '需要获取私人仓库的读写权限',
      },
      steps: {
        chooseBranch: '选择工作分支',
        upload: '将翻译上传至工作分支',
        prDetected: '已发现合并请求，上传的新内容将自动包含在现有请求中',
        pr: '创建合并请求',
      },
      explanation: {
        title: '不熟悉 git 工作流？',
        p1: '使用Github进行协作就像是一群人共同编辑一份文档。为了避免每个人直接在原文档上修改而导致混乱，我们采取了一种分步骤的方法。',
        p2: '想象一下，有一篇原始文章，我们可以为其创建草稿进行修改，最后将草稿的内容呈现给原文作者审查并合并。',
        step1:
          '选择工作分支：创建一个新的草稿（工作分支）或选择一个现有草稿。这样你可以专注于自己的任务，无论是新增内容还是修正现有内容，都不会影响到原始文章和其他人的工作。',
        step2: '将内容上传到分支：将你的本地工作成果保存到自己的云端草稿中。',
        step3:
          '提交合并请求：请求将你的修改从草稿（工作分支）合并回原始文章。这个过程允许文章作者审查你的修改，并在合并前确保内容是正确的。',
      },
    },
    home: {
      history: {
        title: '历史修改',
        table: {
          name: '文件名',
          URL: 'URL',
          latestUpdate: '最后修改',
        },
        clear: '清空历史',
        clearWarning: '将会清除所有历史',
      },
      updates: '游戏更新',
      changelog: '更新日志',
    },
    tips: {
      switch:
        '在翻译文件加载后，可以点击URL输入行最右侧的按钮来切换不同版本的文件',
      extension: '可以安装浏览器扩展以便快速从github页面导航至本网站',
    },
    list: {
      icon: '图标',
      name: '名称',
      openAt: '实装',
      translatedStatus: {
        title: '翻译',
        full: {
          all: '已翻译',
          part: '部分翻译',
          no: '未翻译',
          empty: '无剧情',
        },
        short: {
          all: 'Y',
          part: 'P',
          no: 'N',
          empty: '-',
        },
      },
    },
  },
}

export { messages }
