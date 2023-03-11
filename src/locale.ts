const messages = {
    "en": {
        common: {
            confirm: "confirm",
            cancel: "cancel",
            save: "save",
        },
        tab: {
            Github: "Github",
            Home: "Home",
            Translate: "Translate",
            About: "About"
        },
        control: {
            first: "First",
            next: "Next",
            previous: "Previous",
            review: "Review",
            index: "Index",
        },
        translate: {
            translatePlaceholder: "Press Enter↩ to input '\\n' and press Shift⇧ + Enter↩ to save",
            saveSuccess: "Saved",
            loadRawWarning: "A raw json file is loaded",
            remoteTranslationDetected: "Remote translation is deteted. Click the 【RAW】 button at the top right corner to switch",
            overwriteWarning: "Overwrite Warning",
            overwriteDetails: "A history save of current file is detected. This action will OVERWRITE the existed histroy save",
            switch: {
                title: "Switch Data Source",
                explanation: {
                    raw: "Raw json file",
                    history: "History save from browser",
                    server: "Translation by ShinyGroup",
                    file: "File from disk",
                },
                reloadTooltip: "Requery translated file existence",
                reloadFinished: "Requery finished"
            },
            rename: {
                title: "Rename CSV File",
                defaultName: "Default Name",
                originName: "Origin Name",
                originNameNotFound: "Origin name not found",
            },
            tab: {
                rename: "Rename",
                complete: "Complete",
                switch: "Switch",
                top: "TOP",
            }
        },
        home: {
            history: {
                title: "History Saves",
                table: {
                    name: "File Name",
                    URL: "URL",
                    latestUpdate: "Latest Update",
                },
                clear: "CLEAR HISTORY",
                clearWarning: "Will Clear All History"
            },
            updates: "Game Updates",
            changelog: "Changelog",
        }

    },
    "zh": {
        common: {
            confirm: "确认",
            cancel: "取消",
            save: "保存",
        },
        tab: {
            Github: "Github",
            Home: "主页",
            Translate: "翻译",
            About: "关于"
        },
        control: {
            first: "回到最初",
            next: "下一节",
            previous: "上一节",
            review: "回顾故事",
            index: "目录",
        },
        translate: {
            translatePlaceholder: "按下 Enter↩ 输入 '\\n'，\n按下 Shift⇧ + Enter↩ 保存",
            saveSuccess: "已保存",
            loadRawWarning: "当前加载源为原始 JSON 文件",
            remoteTranslationDetected: "检测到已翻译文件。点击右上角【RAW】按钮切换",
            overwriteWarning: "历史修改将被覆盖",
            overwriteDetails: "检测到浏览器中当前文件的历史修改，本操作会覆盖历史修改，导致历史修改丢失",
            switch: {
                title: "切换数据源",
                explanation: {
                    raw: "原始JSON文件",
                    history: "浏览器中的历史修改",
                    server: "ShinyGroup维护的翻译文件",
                    file: "磁盘中的文件",
                },
                reloadTooltip: "重新查询翻译文件是否存在",
                reloadFinished: "查询完成"
            },
            rename: {
                title: "设置 CSV 文件名",
                defaultName: "使用缺省名",
                originName: "使用文件原名",
                originNameNotFound: "未找到文件原名",

            },
            tab: {
                rename: "CSV 更名",
                complete: "下载/推送",
                switch: "数据源切换",
                top: "TOP",
            }
        },
        home: {
            history: {
                title: "历史修改",
                table: {
                    name: "文件名",
                    URL: "URL",
                    latestUpdate: "最后修改",
                },
                clear: "清空历史",
                clearWarning: "将会清除所有历史"
            },
            updates: "游戏更新",
            changelog: "更新日志",
        },
        tips: {
            switch: "在翻译文件加载后，可以点击URL输入行最右侧的按钮来切换不同版本的文件",
            extension: "可以安装浏览器扩展以便快速从github页面导航至本网站"
        }
    }
}

export {
    messages
}
