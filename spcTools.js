/**
 * author: sirio e-mail:954711908@qq.com date: 2021.04.17
 * 1.class中包含七种计量型spc图表的数据处理函数
 * 2.根据参数送入原始数据，按对应qc算法返回绘图所需的后处理数据
 * 3.根据后处理数据进行图表绘制
 * xRControl:均值-极差控制图
 * xSControl:均值-标准差控制图
 * cpkChart:工序能力分析图
 * histogram:直方图
 * permutationChart:排列图
 * sampleTrendChart:样本趋势图
 * basicTrendChart:基本趋势图
 **/
class SpcTools{
  /**
   * ///均值-极差控制图///
   * 计算绘制均值极差图所需的子组平均值、子组极差、总平均值、总极差、CL、UCL、LCL等
   * @param {Array} dataList 样本数据
   * @param {Number} subgroupNum 子组个数（分成多少组）
   * @param {Number} subgroupCapacity 子组容量（每组多少个）
   * @return {{}}
   */
  xRControl(dataList, subgroupNum, subgroupCapacity) {
    try {
      if (subgroupCapacity < 2 || subgroupCapacity > 25) {
        throw new Error('子组容量不能小于2或大于25')
      } else {
        if(subgroupCapacity < 4 || subgroupCapacity > 5) {
          console.log('\x1B[33mWarning: 根据质量统计手册（SPC）第二版要求，均值-极差控制图子组容量以4或5个为宜\x1B[33m')
        }

        if(subgroupNum < 20 || subgroupNum > 25) {
          console.log('\x1B[33mWarning: 根据质量统计手册（SPC）第二版要求，均值-极差控制图子组个数以20至25个为宜\x1B[33m')
        }

        // 分组后的样本数据
        let sampleGroupingData = _chunk(dataList, subgroupNum, subgroupCapacity)

        // 计算每个子组的平均值存入averageArr中,极差存入rangeArr中
        let averageArr = []
        let rangeArr= []
        sampleGroupingData.forEach(item => {
          averageArr.push(_average(item))
          rangeArr.push(_range(item))
        })

        // 计算平均值的平均值aAverage与极差平均值rangeAverage
        let aAverage = _average(averageArr)
        let rangeAverage = _average(rangeArr)

        // X图控制界限
        // CLx = aAverage 各组样本平均值的平均值
        // UCLx = aAverage + A2rangeAverage
        // LCLx = aAverage - A2rangeAverage
        let A2 = parameterA2[subgroupCapacity - 2]
        let CLx = aAverage
        let UCLx = Number(big._accAdd(aAverage, big._accMul(A2, rangeAverage)).toFixed(2))
        let LCLx = Number(big._accSub(aAverage, big._accMul(A2, rangeAverage)).toFixed(2))

        // R图控制界限
        // CLr = rangeAverage 各组样本极差的平均值
        // UCLr = D4rangeAverage
        // LCLr = D3rangeAverage
        let D4 = parameterD4[subgroupCapacity - 2]
        let D3 = parameterD3[subgroupCapacity - 2]
        let CLr = rangeAverage
        let UCLr = Number(big._accMul(D4, rangeAverage).toFixed(2))
        let LCLr = Number(big._accMul(D3, rangeAverage).toFixed(2))

        let retXR = {
          Xcontrol: {
            Clx: {
              desc: '均值控制图中心线',
              value: CLx
            },
            UCLx: {
              desc: '均值控制图上线',
              value: UCLx
            },
            LCLx: {
              desc: '均值控制图下线',
              value: LCLx
            },
            chartSpot: {
              desc: '均值控制图点坐标',
              value: averageArr
            }
          },
          Rcontrol: {
            Clr: {
              desc: '极差控制图中心线',
              value: CLr
            },
            UCLr: {
              desc: '极差控制图上限',
              value: UCLr
            },
            LCLr: {
              desc: '极差控制图下限',
              value: LCLr
            },
            chartSpot: {
              desc: '极差控制图点坐标',
              value: rangeArr
            }
          }
        }

        return retXR
      }
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * ///均值-标准差控制图///
   * 计算绘制均值极差图所需的子组平均值、子组极差、总平均值、总标准差、CL、UCL、LCL等
   * @param {Array} dataList 样本数据
   * @param {Number} subgroupNum 子组个数（分成多少组）
   * @param {Number} subgroupCapacity 子组容量（每组多少个）
   * @return {{}}
   */
  xSControl (dataList, subgroupNum, subgroupCapacity) {
    try {
      if (subgroupCapacity < 2 || subgroupCapacity > 25) {
        throw new Error('子组容量不能小于2或大于25')
      } else {
        if (subgroupCapacity < 10) {
          console.log('\x1B[33mWarning: 根据质量统计手册（SPC）第二版要求，均值-标准差控制图子组容量以>10为宜\x1B[33m')
        }

        if (subgroupNum < 20 || subgroupNum > 25) {
          console.log('\x1B[33mWarning: 根据质量统计手册（SPC）第二版要求，均值-标准差控制图子组个数以20至25个为宜\x1B[33m')
        }
        // 分组后的样本数据
        let sampleGroupingData = _chunk(dataList, subgroupNum, subgroupCapacity)

        // 计算每个子组的平均值存入averageArr中,标准差存入standardArr中
        let averageArr = []
        let standardArr = []
        sampleGroupingData.forEach(item => {
          averageArr.push(_average(item))
          standardArr.push(_standard(item))
        })

        // 计算平均值的平均值aAverage与极差平均值rangeAverage
        let aAverage = _average(averageArr)
        let standardAverage = _average(standardArr)

        // X图控制界限
        // CLx = aAverage 各组样本平均值的平均值
        // UCLx = aAverage + A3standardAverage
        // LCLx = aAverage - A3standardAverage
        let A3 = parameterA3[subgroupCapacity - 2]
        let CLx = aAverage
        let UCLx = Number(big._accAdd(aAverage, big._accMul(A3, standardAverage)).toFixed(2))
        let LCLx = Number(big._accSub(aAverage, big._accMul(A3, standardAverage)).toFixed(2))

        // S图控制界限
        // CLs = standardAverage 各组样本标准差的平均值
        // UCLs = B4standardAverage
        // LCLs = B3standardAverage
        let B4 = parameterB4[subgroupCapacity - 2]
        let B3 = parameterB3[subgroupCapacity - 2]
        let CLs = standardAverage
        let UCLs = Number(big._accMul(B4, standardAverage).toFixed(2))
        let LCLs = Number(big._accMul(B3, standardAverage).toFixed(2))

        let retXS = {
          Xcontrol: {
            Clx: {
              desc: '均值控制图中心线',
              value: CLx
            },
            UCLx: {
              desc: '均值控制图上线',
              value: UCLx
            },
            LCLx: {
              desc: '均值控制图下线',
              value: LCLx
            },
            chartSpot: {
              desc: '均值控制图点坐标',
              value: averageArr
            }
          },
          Scontrol: {
            Clr: {
              desc: '标准差控制图中心线',
              value: CLs
            },
            UCLr: {
              desc: '标准差控制图上限',
              value: UCLs
            },
            LCLr: {
              desc: '标准差控制图下限',
              value: LCLs
            },
            chartSpot: {
              desc: '标准差控制图点坐标',
              value: standardArr
            }
          }
        }

        return retXS
      }

    } catch (e) {

    }
  }

  /**
   * ///工序能力分析图///
   * 计算绘制工序能力分析图所需的正太密度值、cp、cpk等
   * @param {Array} dataList 样本数据
   * @param {Number} subgroupNum 子组个数（分成多少组）
   * @param {Number} upperSpecificatioLimit 规格上限（根据不同业务人为规定）
   * @param {Number} lowerSpecificationLimit 规格下限（根据不同业务人为规定）
   * @return {{}}
   * FIXME 此图表由于javascript浮点型精度原因，分组与频数可能会有0.05的偏差，对cp、cpk计算无影响，柱状图与正太分布曲线可能有略微不同
   */
  cpkChart(dataList, subgroupNum, upperSpecificatioLimit, lowerSpecificationLimit, sigmaMultiple){
    try {
      // 计算样本总平均值与样本总标准差
      let average = _average(dataList)
      let standard = _standard(dataList)

      // 技术规范的公差幅度
      let USL = upperSpecificatioLimit
      let LSL = lowerSpecificationLimit
      let T = big._accSub(USL, LSL)

      // 稳定过程能力指数Cp
      let Cp = Number(big._accDiv(T, big._accMul(6, standard)).toFixed(2))

      // 公差范围中心值（期望值）
      let M = Number(big._accDiv(big._accAdd(USL, LSL), 2).toFixed(2))

      // 技术规范的公差幅度
      let e = Math.abs(Number(big._accSub(M, average).toFixed(2)))

      // 修正值K/Ca 制程精确度
      let K = Number(big._accDiv(big._accMul(2, e), T).toFixed(2))

      // 修正后的工序能力指数
      let Cpk = Number(big._accMul(Cp, big._accSub(1, K)).toFixed(2))

      // 望小值质量特征Cpu、Cpl望大值质量特征
      let Cpu = Number(big._accDiv(big._accSub(USL, average),big._accMul(3, standard)).toFixed(2))
      let Cpl = Number(big._accDiv(big._accSub(average, LSL),big._accMul(3, standard)).toFixed(2))

      // 数据分组
      // 确定sigma倍数，可以人为给定，若不给定采取3sigma原则即拉依达准则计算分组上下限
      let sigmaMul = null
      sigmaMultiple ? sigmaMul = sigmaMultiple : sigmaMul = 3
      // lowerLimit = average + sigmaMul*standard 坐标下限
      let lowerLimit = Number(big._accSub(average, big._accMul(sigmaMul, standard)).toFixed(2))
      // upLimit = average + sigmaMul*standard 坐标上限
      let upperLimit = Number(big._accAdd(average, big._accMul(sigmaMul, standard)).toFixed(2))

      // 计算组距
      let groupDistance = Number(big._accDiv(big._accSub(upperLimit, lowerLimit),big._accSub(subgroupNum, 1)).toFixed(2))

      // 根据组距分组
      let num = 0
      let groupArr = []
      let last = 0
      let i = 0
      while (i < subgroupNum) {
        i ++
        (i-1) === 0 ? num = lowerLimit : num = Number(big._accAdd(num, groupDistance).toFixed(6))

        // 计算频数
        let frequency = 0
        dataList.forEach(item => {
          if((i-1) === 0) {
            if(item < num) {
              frequency ++
            }
          } else if (i === subgroupNum) {
            if(item > num) {
              frequency ++
            }
          } else {
            if(item > last && item <= num) {
              frequency ++
            }
          }
        })
        last = num

        // 组坐标的正太分布密度
        let density = null
        density = normDist.normDistFunc(num, average, standard, false)

        groupArr.push({
          x: num,
          y: frequency,
          density: density.toFixed(3)
        })
      }

      let retCpk = {
        Cp: {
          desc: '稳定过程能力指数',
          value: Cp
        },
        Cpk: {
          desc: '修正后的工序能力指数',
          value: Cpk
        },
        M: {
          desc: '公差范围中心值（期望值）',
          value: M
        },
        USL: {
          desc: '技术规格上限',
          value: USL
        },
        LSL: {
          desc: '技术规格下限',
          value: LSL
        },
        T: {
          desc: '公差幅度',
          value: T
        },
        Cpu: {
          desc: '望小值质量特性',
          value: Cpu
        },
        Cpl: {
          desc: '望大值质量特性',
          value: Cpl
        },
        average: {
          desc: '样本均值',
          value: average
        },
        normalDistribution: {
          desc: '正太分布密度',
          value: groupArr
        }
      }

      return retCpk
    } catch (e) {
      console(e)
    }
  }

  /**
   * ///直方图///
   * 计算绘制直方图所需的数据分组以及组频数等
   * @param {Array} dataList 样本数据
   * @param {Number} subgroupNum 子组个数（分成多少组）
   * @return {{}}
   */
  histogram(dataList, subgroupNum) {
    try {
      if (dataList.length < 50) {
        console.log('\x1B[33mWarning: 根据质量统计手册（SPC）第二版要求，直方图样本大小以>50为宜\x1B[33m')
      }
      // 最小值
      let min = Math.min(...dataList)

      // 最大值
      let max = Math.max(...dataList)

      // 确定极差
      let range = _range(dataList)

      // 计算组距
      let groupDistance = Number(big._accDiv(range, subgroupNum).toFixed(3))

      // 根据组距分组
      let num = min
      let groupArr = []
      let last = min
      let i = 0
      let groupName = ''
      while (i < subgroupNum) {
        i ++
        // 组坐标
        num = Number(big._accAdd(num, groupDistance).toFixed(3))

        groupName = last + '~' + num

        // 计算频数
        let frequency = 0
        dataList.forEach(item => {
          if((i) === subgroupNum) {
            if(item >= last && item <= num) {
              frequency ++
            }
          } else {
            if(item >= last && item < num) {
              frequency ++
            }
          }
        })
        last = num

        groupArr.push({
          x: groupName,
          y: frequency,
        })
      }

      let retHistogram = {
        desc: '分组与频数',
        value: groupArr
      }

      return retHistogram
    } catch (e) {
      console.log(e)
    }
  }


  /**
   * ///排列图///
   * 计算绘制排列图所需的数据分组、组频数、累计百分比等
   * @param {Array} dataList 样本数据
   * @param {Number} subgroupNum 子组个数（分成多少组）
   * @return {{}}
   */
  permutationChart(dataList) {
    try {
      let len = dataList.length
      let groupArr = []
      // 原数组去重
      let newDataList = _unique(dataList)

      // 计算原数组每个数值出现的频数
      newDataList.forEach(item => {
        let frequency = _count(dataList, item)
        let cumulativePercentage = Number((big._accMul(big._accDiv(frequency, len), 100)).toFixed(2))
        groupArr.push({
          x: item,
          y: frequency,
          percentage: cumulativePercentage
        })
      })

      let retPermutation = {
        desc: '分组、频数与累计百分数',
        value: groupArr
      }

      return retPermutation
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * ///样本趋势图///
   * 按时间绘制各点并连线即可
   * @param dataList
   * @return {{}}
   */
  sampleTrendChart(dataList) {
    try {
      if(!dataList[0].hasOwnProperty('time')) {
        throw new Error('样本数据中必须包含时间纬度，请参照dataList: [{time: time, value: value}]调用')
      } else {
        let retSampleTrend =  {
          desc: '以测量值为纵坐标，以该测量值获取时间为横坐标绘制点线图即可',
          value: dataList
        }
        return retSampleTrend
      }
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * ///基本趋势图///
   * @param dataList
   * @return {{}}
   */
  basicTrendChart(dataList, upperSpecificatioLimit, lowerSpecificationLimit) {
    try {
      if(!dataList[0].hasOwnProperty('time')) {
        throw new Error('样本数据中必须包含时间纬度，请参照dataList: [{time: time, value: value}]调用')
      } else {
        let USL = upperSpecificatioLimit
        let LSL = lowerSpecificationLimit
        let retBasicTrend =  {
          desc: '按时间绘制各点并连线, USL为上界，LSL为下界限绘制图表',
          value: dataList,
          USL: upperSpecificatioLimit,
          LSL: lowerSpecificationLimit
        }
        return retBasicTrend
      }
    } catch (e) {
      console.log(e)
    }
  }
}

/**
 * 数组去重函数
 * @param arr
 * @return {any[]}
 * @private
 */
function _unique (arr) {
  return Array.from(new Set(arr))
}

/**
 * 数组同值频数计算函数
 * @param arr
 * @param item
 * @return {number}
 * @private
 */
function _count(arr, item) {
  let sum = 0;
  arr.forEach(e => {
    if(e === item){
      sum++
    }
  })
  return sum
}

/**
 * 将原始数组分成capacity组，每组num元素
 * @param arr 需要进行分组的数据
 * @param num 将数据分成多少组
 * @param capacity 每组多少个数据
 * @return {*[]}
 * @private
 */
function _chunk(arr, num, capacity){
  capacity = capacity*1 || 1;
  let ret = [];
  arr.forEach(function(item, i){
    if(i % capacity === 0){
      ret.push([]);
    }
    ret[ret.length - 1].push(item);
  });

  let newRet  = ret.slice(0,num)
  return newRet;
}

/**
 * 平均值函数
 * @param nums
 * @return {number}
 * @private
 */
function _average(nums) {
  let average = (big._accDiv(nums.reduce((a, b) => a + b), nums.length))
  return Number(average.toFixed(2));
}

/**
 * 极差函数
 * @param nums
 * @return {number}
 */
function _range(nums){
  let max = Math.max(...nums);
  let min = Math.min(...nums);
  let range = big._accSub(max, min)
  return Number(range);
}

/**
 * 标准差函数
 * @param nums
 * @return {number}
 */
function _standard(nums) {
  let avg = 0;
  let length = nums.length;
  let len = nums.length;
  let sum = 0;
  for(let i = 0; i < len ; i++){
    sum = big._accAdd(sum, nums[i]);
  }
  avg = big._accDiv(sum, len) ;
  let temp = [];
  for (let i = 0; i < length; i++) {
    let dev =  big._accSub((nums[i]) , avg) ; //计算数组元素与平均值的差
    temp[i] = Math.pow(dev, 2); //计算差的平方
  }
  let powSum = 0; //用来存储差的平方总和
  for (let j = 0; j < temp.length; j++) {
    if (temp[j]) {
      powSum = big._accAdd(powSum, temp[j]) //计算差的平方总和
    }
  }
  //用差的平方总和除以数组长度即可得到标准差
  return  parseFloat( Math.sqrt(big._accDiv(powSum, length-1)).toFixed(2));
}


/**
 * NormDist类，用于计算某点的正太分布密度
 */
class NormDist {
  /**
   * @param x
   * @param mean
   * @param std
   * @return {number}
   * @private
   */
  _normDistFuncFalse(x, mean, std) {
    let a = big._accSub(x, mean)
    let b = big._accMul(a, a)
    let c = big._accMul(std, std)
    let d = big._accMul(2.0, c)
    const exponent = big._accDiv(b, d)
    let e = big._accMul(2.0, Math.PI)
    let f = big._accMul(Math.sqrt(e), std)
    let g = big._accDiv(Math.exp(-exponent), f)
    return Number(g.toFixed(3))
  }

  /**
   * @param x
   * @param mean
   * @param std
   * @return {number}
   * @private
   */
  _normDistFuncTrue(x, mean, std) {
    let res,t
    const oor2pi = 1 / Math.sqrt(2.0 * Math.PI)
    const x2 = (x - mean) / std
    if(x2 === 0) {
      res = 0.5
    } else {
      t = 1 / (1.0 + 0.2316419 * Math.abs(x2))
      t = t * oor2pi * Math.exp(-0.5 * x2 * x2) * (
        0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
    }
    if (x2 > 0) {
      res = 1.0 - t
    } else {
      res = t
    }
    return res
  }

  /**
   * @param x
   * @param mean
   * @param std
   * @param cumulative
   * @return {*}
   */
  normDistFunc(x, mean, std, cumulative) {
    let result
    if (cumulative) {
      result = normDist._normDistFuncTrue(x, mean, std)
    } else {
      result = normDist._normDistFuncFalse(x, mean, std)
    }
    return result
  }
}

/**
 * 精度处理类
 */
class BigNumber {
  /**
   ** 加法函数，用来得到精确的加法结果
   ** 说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
   ** 调用：accAdd(arg1,arg2)
   ** 返回值：arg1加上arg2的精确结果
   **/
   _accAdd(arg1, arg2) {
    let r1, r2, m, c;
    try {
      r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
      r2 = 0;
    }
    c = Math.abs(r1 - r2);
    m = Math.pow(10, Math.max(r1, r2));
    if (c > 0) {
      var cm = Math.pow(10, c);
      if (r1 > r2) {
        arg1 = Number(arg1.toString().replace(".", ""));
        arg2 = Number(arg2.toString().replace(".", "")) * cm;
      } else {
        arg1 = Number(arg1.toString().replace(".", "")) * cm;
        arg2 = Number(arg2.toString().replace(".", ""));
      }
    } else {
      arg1 = Number(arg1.toString().replace(".", ""));
      arg2 = Number(arg2.toString().replace(".", ""));
    }
    return (arg1 + arg2) / m;
  }

  /**
   ** 减法函数，用来得到精确的减法结果
   ** 说明：javascript的减法结果会有误差，在两个浮点数相减的时候会比较明显。这个函数返回较为精确的减法结果。
   ** 调用：accSub(arg1,arg2)
   ** 返回值：arg1加上arg2的精确结果
   **/
   _accSub(arg1, arg2) {
    let r1, r2, m, n;
    try {
      r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
      r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2)); //last modify by deeka //动态控制精度长度
    n = r1 >= r2 ? r1 : r2;
    return Number(((arg1 * m - arg2 * m) / m).toFixed(n))
  }

  /**
   ** 乘法函数，用来得到精确的乘法结果
   ** 说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。
   ** 调用：accMul(arg1,arg2)
   ** 返回值：arg1乘以 arg2的精确结果
   **/
   _accMul(arg1, arg2) {
    let m = 0,
      s1 = arg1.toString(),
      s2 = arg2.toString();
    try {
      m += s1.split(".")[1].length;
    } catch (e) {}
    try {
      m += s2.split(".")[1].length;
    } catch (e) {}
    return (
      (Number(s1.replace(".", "")) * Number(s2.replace(".", ""))) /
      Math.pow(10, m)
    );
  }

  /**
   ** 除法函数，用来得到精确的除法结果
   ** 说明：javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。
   ** 调用：accDiv(arg1,arg2)
   ** 返回值：arg1除以arg2的精确结果
   **/
  _accDiv(arg1, arg2) {
    let t1 = 0,
      t2 = 0,
      r1,
      r2;
    try {
      t1 = arg1.toString().split(".")[1].length;
    } catch (e) {}
    try {
      t2 = arg2.toString().split(".")[1].length;
    } catch (e) {}
      r1 = Number(arg1.toString().replace(".", ""));
      r2 = Number(arg2.toString().replace(".", ""));
      return (r1 / r2) * Math.pow(10, t2 - t1);
  }
}

const big = new BigNumber()
const normDist = new NormDist()
export const spcTools = new SpcTools()

// 根据统计过程控制(SPC)参考手册（第二版）查的参数A2、D3、D4、A3、B3、B4如下，请根据子组容量选择,index = 0时,子组容量为2以此类推
const parameterA2 = [1.880, 1.023, 0.729, 0.577, 0.483, 0.419, 0.373, 0.337, 0.308, 0.285, 0.266, 0.249, 0.235, 0.223, 0.212, 0.203, 0.194, 0.187, 0.180, 0.173, 0.167, 0.162, 0.157, 0.153]
const parameterD3 = [0, 0, 0, 0, 0, 0.076, 0.136, 0.184, 0.223, 0.256, 0.283, 0.307, 0.328, 0.347, 0.363, 0.378, 0.391, 0.403, 0.415, 0.425, 0.434, 0.443, 0.451, 0.459]
const parameterD4 = [3.267, 2.574, 2.282, 2.114, 2.004, 1.924, 1.864, 1.816, 1.777, 1.744, 1.717, 1.693, 1.672, 1.653, 1.637, 1.622, 1.608, 1.597, 1.585, 1.575, 1.566, 1.557, 1.548, 1.541]
const parameterA3 = [2.659, 1.954, 1.628, 1.427, 1.287, 1.182, 1.099, 1.032, 0.975, 0.927, 0.886, 0.850, 0.817, 0.789, 0.763, 0.739, 0.718, 0.698, 0.680, 0.663, 0.647, 0.633, 0.619, 0.606]
const parameterB3 = [0, 0, 0, 0, 0.030, 0.118, 0.185, 0.239, 0.284, 0.321, 0.354, 0.382, 0.406, 0.428, 0.448, 0.466, 0.482, 0.497, 0.510, 0.523, 0.534, 1.545, 0.555, 0.565]
const parameterB4 = [3.267, 2.568, 2.266, 2.089, 1.970, 1.882, 1.815, 1.761, 1.716, 1.679, 1.646, 1.618, 1.594, 1.572, 1.552, 1.534, 1.518, 1.503, 1.490, 1.477, 1.466, 1.455, 1.445, 1.435]
