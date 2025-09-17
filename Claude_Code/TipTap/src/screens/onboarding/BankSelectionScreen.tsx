import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList} from '@/types';

type BankSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BankSelection'
>;

interface Props {
  navigation: BankSelectionScreenNavigationProp;
}

interface Bank {
  id: string;
  name: string;
  logo?: string;
}

const POPULAR_BANKS: Bank[] = [
  {id: 'chase', name: 'Chase'},
  {id: 'wellsfargo', name: 'Wells Fargo'},
  {id: 'bankofamerica', name: 'Bank of America'},
  {id: 'citibank', name: 'Citibank'},
  {id: 'usbank', name: 'U.S. Bank'},
  {id: 'truist', name: 'Truist'},
  {id: 'pnc', name: 'PNC Bank'},
  {id: 'capitalone', name: 'Capital One'},
];

const BankSelectionScreen: React.FC<Props> = ({navigation}) => {
  const [searchText, setSearchText] = useState('');
  const [filteredBanks, setFilteredBanks] = useState(POPULAR_BANKS);

  const handleSearch = (text: string) => {
    setSearchText(text);
    const filtered = POPULAR_BANKS.filter(bank =>
      bank.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredBanks(filtered);
  };

  const handleBankSelect = (bank: Bank) => {
    navigation.navigate('BankCredentials', {bankName: bank.name, bankId: bank.id});
  };

  const handleManualEntry = () => {
    // TODO: Implement manual bank entry
    console.log('Manual entry pressed');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderBankItem = ({item}: {item: Bank}) => (
    <TouchableOpacity
      style={styles.bankItem}
      onPress={() => handleBankSelect(item)}
    >
      <View style={styles.bankLogo}>
        <Text style={styles.bankInitial}>{item.name.charAt(0)}</Text>
      </View>
      <Text style={styles.bankName}>{item.name}</Text>
      <Icon name="chevron-right" size={24} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Bank</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search banks..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <FlatList
          data={filteredBanks}
          renderItem={renderBankItem}
          keyExtractor={item => item.id}
          style={styles.bankList}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
          <Text style={styles.manualText}>Can't find yours?</Text>
          <Text style={styles.manualLink}>Add manually</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  bankList: {
    flex: 1,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  bankLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bankInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bankName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  manualButton: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  manualText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  manualLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default BankSelectionScreen;