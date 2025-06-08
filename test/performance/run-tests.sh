#!/bin/bash

# 漂流瓶聊天系统测试运行脚本
# 使用方法: ./run-tests.sh [stress|ux|all] [light|medium|heavy|extreme]

echo "🚀 漂流瓶聊天系统 - 测试运行脚本"
echo "======================================="

# 检查参数
TEST_TYPE=${1:-all}
TEST_LEVEL=${2:-light}

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${BLUE}📦 检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  未找到 node_modules，正在安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
fi

# 检查测试目标
if [ -z "$TEST_BASE_URL" ]; then
    export TEST_BASE_URL="http://localhost:3000"
    echo -e "${YELLOW}🌐 使用默认测试地址: ${TEST_BASE_URL}${NC}"
fi

echo -e "${GREEN}✅ 测试目标: ${TEST_BASE_URL}${NC}"

# 运行压力测试
run_stress_test() {
    local level=$1
    echo -e "\n${BLUE}🔥 开始压力测试 (${level})...${NC}"
    
    case $level in
        light)
            MAX_USERS=10 TEST_DURATION=60000 npm run test:stress 2>/dev/null
            ;;
        medium)
            MAX_USERS=30 TEST_DURATION=180000 npm run test:stress 2>/dev/null
            ;;
        heavy)
            MAX_USERS=50 TEST_DURATION=300000 npm run test:stress 2>/dev/null
            ;;
        extreme)
            MAX_USERS=100 TEST_DURATION=600000 npm run test:stress 2>/dev/null
            ;;
        *)
            echo -e "${RED}❌ 未知的测试级别: $level${NC}"
            return 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 压力测试通过${NC}"
        return 0
    else
        echo -e "${RED}❌ 压力测试失败${NC}"
        return 1
    fi
}

# 运行用户体验测试
run_ux_test() {
    echo -e "\n${BLUE}📱 开始用户体验测试...${NC}"
    
    npm run test:ux 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 用户体验测试通过${NC}"
        return 0
    else
        echo -e "${RED}❌ 用户体验测试失败${NC}"
        return 1
    fi
}

# 主逻辑
case $TEST_TYPE in
    stress)
        run_stress_test $TEST_LEVEL
        exit $?
        ;;
    ux)
        run_ux_test
        exit $?
        ;;
    all)
        echo -e "${BLUE}🔄 运行完整测试套件...${NC}"
        
        # 先运行轻量压力测试
        run_stress_test light
        STRESS_RESULT=$?
        
        # 再运行用户体验测试
        run_ux_test
        UX_RESULT=$?
        
        # 总结结果
        echo -e "\n${BLUE}📊 测试总结:${NC}"
        if [ $STRESS_RESULT -eq 0 ]; then
            echo -e "${GREEN}✅ 压力测试: 通过${NC}"
        else
            echo -e "${RED}❌ 压力测试: 失败${NC}"
        fi
        
        if [ $UX_RESULT -eq 0 ]; then
            echo -e "${GREEN}✅ 用户体验测试: 通过${NC}"
        else
            echo -e "${RED}❌ 用户体验测试: 失败${NC}"
        fi
        
        if [ $STRESS_RESULT -eq 0 ] && [ $UX_RESULT -eq 0 ]; then
            echo -e "\n${GREEN}🎉 所有测试通过！系统已准备就绪 🚀${NC}"
            exit 0
        else
            echo -e "\n${RED}⚠️  部分测试失败，请检查系统状态${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ 未知的测试类型: $TEST_TYPE${NC}"
        echo "使用方法: $0 [stress|ux|all] [light|medium|heavy|extreme]"
        echo ""
        echo "测试类型:"
        echo "  stress - 性能压力测试"
        echo "  ux     - 用户体验测试"
        echo "  all    - 运行所有测试"
        echo ""
        echo "测试级别 (仅适用于压力测试):"
        echo "  light   - 轻量 (10用户, 1分钟)"
        echo "  medium  - 中等 (30用户, 3分钟)"
        echo "  heavy   - 重载 (50用户, 5分钟)"
        echo "  extreme - 极限 (100用户, 10分钟)"
        exit 1
        ;;
esac 